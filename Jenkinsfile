pipeline {
    agent { label 'WEB' }

    environment {
        APP_NAME = "v2x-web"  
        RELEASE = "1.0.0"
        DOCKER_USER = "mahmoud1122ashraf"
        IMAGE_NAME = "${DOCKER_USER}/${APP_NAME}"
        IMAGE_TAG = "${RELEASE}-${BUILD_NUMBER}"
        DOCKER_CREDENTIALS = credentials("dockerhub-credential") 
        SONAR_TOKEN = credentials('sonar-credential')
        STATIC_ANALYSIS_TYPE = '0'  
        SONAR_PROJECT_KEY = 'web-v2x'
        SONAR_PROJECT_NAME = 'web-v2x'
        SONAR_PROJECT_VERSION = '1.0'
        SONAR_INSTANCE_IP = '9.141.172.84'
        SCANNER_HOME = tool 'sonar-scanner'
        CONTAINER_NAME = "${APP_NAME}-container"
    }

    stages {
        stage("Checkout from SCM") {
            steps {
                git branch: 'main', credentialsId: 'web-github', url: 'https://github.com/Ali-Maklad/V2X.git'
            }
        }

        stage('SonarQube Analysis') {
            when {
                expression { STATIC_ANALYSIS_TYPE == '0' }
            }
            steps {
                script {
                    withSonarQubeEnv('sonarqube') {
                        echo 'Start SonarQube analysis'
                        sh """
                            ${SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName=${SONAR_PROJECT_NAME} \
                            -Dsonar.projectVersion=${SONAR_PROJECT_VERSION} \
                            -Dsonar.sources=. \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.exclusions=**/node_modules
                        """
                        echo 'End SonarQube analysis'
                    }
                }
            }
        }

      /*  stage('Quality Gate') {
            when {
                expression { STATIC_ANALYSIS_TYPE == '0' }
            }
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "Quality Gate failed: ${qg.status}"
                        }
                    }
                }
            }
        } */
        stage("Install Dependencies") {
            steps {
                script {
                    // Using Docker container with Node.js installed
                    docker.image('node:18').inside {
                        sh 'npm install -g npm' 
                        sh 'npm install'
                    }
                }
            }
        }

        stage("Build Docker Image") {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credential') {
                        def docker_image = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "-f Dockerfile .")
                        docker_image.push()
                        //docker_image.push('latest')
                    }
                }
            }
        }

        stage("Remove Old Container") {  
            steps {
                script {
                    sh '''
                    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
                        docker stop $CONTAINER_NAME || true
                        docker rm $CONTAINER_NAME || true
                    fi
                    '''
                }
            }
        }

        stage("Run APP") {
            steps {
                script {
                    sh """
                    docker run -d --name ${CONTAINER_NAME} -p 3000:3000 ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage("Trivy Scan") {
            steps {
                script {
                    try {
                        sh """
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image ${IMAGE_NAME}:${IMAGE_TAG} --no-progress \
                            --scanners vuln --exit-code 0 --severity HIGH,CRITICAL --format table
                        """
                    } catch (Exception e) {
                        echo "Trivy scan failed: ${e.message}"
                    }
                }
            }
        }

        stage("Cleanup Docker Artifacts") {
            steps {
                script {
                    try {
                        sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
                        sh "docker rmi ${IMAGE_NAME}:latest || true"
                    } catch (Exception e) {
                        echo "Error during cleanup: ${e.message}"
                    }
                }
            }
        }
    }

    post {
        failure {
            slackSend(
                channel: '#v2x_',
                color: 'danger',
                message: "Build failed: ${currentBuild.fullDisplayName}"
            )
            emailext(
                subject: "Jenkins Build Failed: ${currentBuild.fullDisplayName}",
                body: "The build failed. Please check the Jenkins console for details.",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }

        success {
            slackSend(
                channel: '#v2x_',
                color: 'good',
                message: "Build successful: ${currentBuild.fullDisplayName}"
            )
            emailext(
                subject: "Jenkins Build Successful: ${currentBuild.fullDisplayName}",
                body: "The build was successful. It's ready for deployment.",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }

        unstable {
            slackSend(
                channel: '#v2x_',
                color: 'warning',
                message: "Build unstable (Quality Gate failed): ${currentBuild.fullDisplayName}"
            )
            emailext(
                subject: "Jenkins Build Unstable: ${currentBuild.fullDisplayName}",
                body: "The build has passed but with warnings (Quality Gate failed). Please check the SonarQube details for more information.",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }
    }
}
