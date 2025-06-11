pipeline {
    agent {
        label 'WSL_Ubuntu'
    }

    tools {
        git 'linux-git'
    }


    stages {
        stage('Build do Backend') {
            steps {
                script {
                    dockerapp = docker.build("viniciusemanuelds/projeto-devops:${env.BUILD_ID}",'-f ./src/backend/Dockerfile ./src/backend')
                }
            }
        }

        stage('Push da imagem') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                        dockerapp.push('latest')
                        dockerapp.push("${env.BUILD_ID}")
                    }
                }
            }
        }

        stage('Deploy no Kubernetes') {
            environment {
                tag_version = "${env.BUILD_ID}"
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh 'sed -i "s/{{tag}}/$tag_version/g" ./k8s/projeto-devops.yaml'
                    sh 'kubectl apply -f ./k8s/projeto-devops.yaml -n devops'
                }
            }
        }
    }

    post {
        success {
            chuckNorris()
        }
        failure {
            echo 'Build falhou. Mas Chuck Norris nunca falha.'
        }
    }
}
