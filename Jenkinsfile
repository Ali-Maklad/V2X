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
        DOCKER_CREDENTIALS = credentials("dockerhub-credentials")
        IMAGE_NAME = "${DOCKER_USER}/${APP_NAME}"
        IMAGE_TAG = "${RELEASE}-${BUILD_NUMBER}"
    }

    stages {
        stage("Cleanup Workspace") {
            steps {
                cleanWs()
            }
        }

        stage("Checkout from SCM") {
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
        
        stage("SonarQube Analysis") {
            steps {
                script {
                    withSonarQubeEnv(credentialsId: 'jenkins-token-sonarqube') {
                        sh 'mvn clean verify sonar:sonar -Dsonar.projectKey=emqx-container -Dsonar.host.url=http://172.178.140.193:9000'
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
        stage("Run v2x-app") {
            steps {
                script {
                    sh """
                    docker run -d --name ${APP_NAME}-container -p 3000:3000 ${IMAGE_NAME}:${IMAGE_TAG}
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
