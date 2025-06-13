pipeline {
    agent {
        label 'WSL_Ubuntu'
    }

    tools {
        git 'linux-git'
    }

    environment {
        DISCORD = credentials('discord')
    }

    stages {

        stage('Análise com SonarQube') {
            steps {
                withSonarQubeEnv('sonar-local') {
                    sh """
                    sonar-scanner \
                        -Dsonar.projectKey=projeto-devops \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.token=${env.SONAR_TOKEN} \
                        -Dsonar.python.version=3.9 \
                        -Dsonar.exclusions=trivy/**
                    """
                }
            }
        }

        stage('Build do Backend') {
            steps {
                script {
                    dockerapp = docker.build("viniciusemanuelds/projeto-devops:${env.BUILD_ID}",'-f ./src/backend/Dockerfile ./src/backend')
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
                        -v \$PWD:/root/.cache/ \
                        aquasec/trivy \
                        image ${image} \
                        --severity CRITICAL \
                        --ignore-unfixed \
                        --exit-code 1 \
                        --format table \
                        --output trivy-report.txt
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
            script {
                def chuck = chuckNorris()
                def discordWebhook = ${DISCORD}
                def mensagem = """{
                    "content": "🚀 Deploy realizado com sucesso!"
                }"""

                sh """
                curl -H "Content-Type: application/json" \
                    -X POST \
                    -d '${mensagem}' \
                    ${discordWebhook}
                """
            }
        }

        failure {
            script {
                def chuck = chuckNorris()
                def discordWebhook = ${DISCORD}
                def mensagem = """{
                    "content": "⚠️ A pipeline falhou!"
                }"""

                sh """
                curl -H "Content-Type: application/json" \
                    -X POST \
                    -d '${mensagem}' \
                    ${discordWebhook}
                """
            }
        }
    }
}
