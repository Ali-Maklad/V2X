pipeline {
    agent { label 'Jenkins' }

    tools {
        jdk 'java17'
        nodejs 'nodejs-18'
    }

    environment {
        APP_NAME = "register-app-pipeline"
        RELEASE = "1.0.0"
        DOCKER_USER = "mahmoud1122ashraf"
        DOCKER_PASS = 'Mm01066210395'
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
                    sh 'npm install'
                }
            }
        }

        stage("Build Application") {
            steps {
                script {
                    sh 'npm run build'
                }
            }
        }

        stage("Test Application") {
            steps {
                script {
                    sh 'npm test'
                }
            }
        }

        stage("SonarQube Analysis") {
            steps {
                script {
                    withSonarQubeEnv(credentialsId: 'jenkins-token-sonarqube') {
                        sh 'npm run sonar'
                    }
                }
            }
        }

        stage("Quality Gate") {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'jenkins-sonarqube-token'
                }
            }
        }

        stage("Build & Push Docker Image") {
            steps {
                script {
                    docker.withRegistry('', DOCKER_PASS) {
                        docker_image = docker.build("${IMAGE_NAME}")
                    }

                    docker.withRegistry('', DOCKER_PASS) {
                        docker_image.push("${IMAGE_TAG}")
                        docker_image.push('latest')
                    }
                }
            }
        }

        stage("Trivy Scan") {
            steps {
                script {
                    sh '''
                    docker run -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy image ${IMAGE_NAME}:${IMAGE_TAG} --no-progress \
                    --scanners vuln --exit-code 0 --severity HIGH,CRITICAL --format table
                    '''
                }
            }
        }

        stage("Cleanup Artifacts") {
            steps {
                script {
                    sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG}"
                    sh "docker rmi ${IMAGE_NAME}:latest"
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

