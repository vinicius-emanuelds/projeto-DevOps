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

        stage('Scan de Vulnerabilidades com Trivy') {
            steps {
                script {
                    def image = "viniciusemanuelds/projeto-devops:${env.BUILD_ID}"
                    echo "Escaneando a imagem ${image}..."

                    def exitCode = sh(
                        script: """#!/bin/bash
                        docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy \
                        image --severity CRITICAL \
                        --exit-code 1 \
                        ${image}
                        """,
                        returnStatus: true
                    )

                    if (exitCode != 0) {
                        error "❌ Vulnerabilidades CRÍTICAS encontradas na imagem Docker! Build bloqueado."
                    } else {
                        echo "✅ Nenhuma vulnerabilidade crítica encontrada."
                    }
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
