pipeline {
    agent { label 'web' }

    tools {
        jdk 'java17'
        nodejs 'nodejs-18'
        maven 'maven3'
    }

    environment {
        APP_NAME = "v2x"
        RELEASE = "1.0.0"
        DOCKER_USER = "mahmoud1122ashraf"
        SONARQUBE_URL = 'http://172.178.140.193:9000'
        SCANNER_HOME = tool 'sonarqube-scanner' 
        SONAR_PROJECT_KEY = 'APP'
        SONAR_PROJECT_NAME = 'APP'
        SONAR_PROJECT_VERSION = '1.0'
        SONARQUBE_TOKEN = credentials('jenkins-token-sonarqube') 
        DOCKER_CREDENTIALS = credentials("dockerhub-credentials")
        IMAGE_NAME = "${DOCKER_USER}/${APP_NAME}"
        IMAGE_TAG = "${RELEASE}-${BUILD_NUMBER}"
        CONTAINER_NAME = "${APP_NAME}-container"  
    }

    stages {
        stage("Cleanup Workspace") {
            steps {
                cleanWs()
            }
        }

        stage("Git Checkout") {
            steps {
                git branch: 'main', credentialsId: 'web_credentials_github', url: 'https://github.com/Ali-Maklad/V2X.git'
            }
        }

        stage("Install Dependencies") {
            steps {
                script {
                    sh 'npm install -g npm' 
                    sh 'npm install'
                }
            }
        }
 stage('Sonar-Qube-Analysis'){
            when {
               expression { STATIC_ANALYSIS_TYPE == '0'}
            }

            steps{

                
                    
                   script {
                    withSonarQubeEnv('Sonar-Server') {
                        sh "echo 'start sonarqube analysis'"
                         withCredentials([string(credentialsId: 'jenkins-token-sonarqube', variable: 'sonarLogin')]) {
                        sh "${SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY}\
                            -Dsonar.projectName=${SONAR_PROJECT_NAME}\
                            -Dsonar.projectVersion=${SONAR_PROJECT_VERSION}\
                            -Dsonar.token=${SONAR_TOKEN}\
                            -Dsonar.exclusions=**/node_modules"
                        }

                        sh " echo 'end static analysis'"
                    }
                }
                   
                }
                
            }
        stage("Build Docker Image") {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        def docker_image = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "-f Dockerfile .")
                        docker_image.push()
                        docker_image.push('latest')
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
                    sh '''
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy image ${IMAGE_NAME}:${IMAGE_TAG} --no-progress \
                    --scanners vuln --exit-code 0 --severity HIGH,CRITICAL --format table
                    '''
                }
            }
        }

        stage("Cleanup Docker Artifacts") {
            steps {
                script {
                    sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
                    sh "docker rmi ${IMAGE_NAME}:latest || true"
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
            emailext (
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
            emailext (
                subject: "Jenkins Build Successful: ${currentBuild.fullDisplayName}",
                body: "The build was successful. It's ready for deployment.",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }
    }
}
