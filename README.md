# ♾️Projeto DevOps: Guia Definitivo de uma Pipeline CI/CD Completa

Este repositório é a documentação da minha jornada construindo uma esteira de Integração e Entrega Contínua (CI/CD) do zero, um projeto que realizei no programa **Scholarship da CompassUOL**.

Minha intenção aqui foi ir além de um simples "como fazer". Este é um guia detalhado que explora não apenas o "o quê", mas o "porquê" de cada ferramenta, cada comando e cada decisão de arquitetura. O objetivo de uma pipeline CI/CD é criar uma ponte automatizada, segura e eficiente entre o código e o usuário final, e cada linha deste projeto foi pensada para entender e dominar esse fluxo.

## Navegação
- [♾️Projeto DevOps: Guia Definitivo de uma Pipeline CI/CD Completa](#️projeto-devops-guia-definitivo-de-uma-pipeline-cicd-completa)
  - [Navegação](#navegação)
  - [Visão Geral e Arquitetura](#visão-geral-e-arquitetura)
  - [Fase 1: Preparação do Ambiente de Desenvolvimento](#fase-1-preparação-do-ambiente-de-desenvolvimento)
  - [Fase 2: Containerização Profissional com Docker](#fase-2-containerização-profissional-com-docker)
    - [O Dockerfile Otimizado](#o-dockerfile-otimizado)
    - [O `.dockerignore`](#o-dockerignore)
  - [Fase 3: Deploy no Kubernetes: A Forma Manual](#fase-3-deploy-no-kubernetes-a-forma-manual)
    - [A Arquitetura do Deploy](#a-arquitetura-do-deploy)
  - [Fase 4 e 5: Automação com Jenkins e Pipeline as Code](#fase-4-e-5-automação-com-jenkins-e-pipeline-as-code)
    - [Configuração do Jenkins](#configuração-do-jenkins)
    - [O Jenkinsfile Detalhado](#o-jenkinsfile-detalhado)
- [Desafios Extras: Construindo uma Pipeline de Nível Profissional](#desafios-extras-construindo-uma-pipeline-de-nível-profissional)
  - [DevSecOps 1: Análise Estática de Código (SAST) com SonarQube](#devsecops-1-análise-estática-de-código-sast-com-sonarqube)
  - [DevSecOps 2: Análise de Vulnerabilidades com Trivy](#devsecops-2-análise-de-vulnerabilidades-com-trivy)
  - [Automação do Fluxo: Webhooks para GitHub (com Smee.io) e Notificações no Discord](#automação-do-fluxo-webhooks-para-github-com-smeeio-e-notificações-no-discord)
  - [Infraestrutura como Código Avançada: Deploy com Helm](#infraestrutura-como-código-avançada-deploy-com-helm)
  - [Conclusão e Principais Aprendizados](#conclusão-e-principais-aprendizados)

<br>

---

## Visão Geral e Arquitetura

O fluxo de trabalho automatizado (pipeline) que construí segue os seguintes passos:

1. O código de uma API em **FastAPI** é enviado (`push`) para o **GitHub**.
2. Um webhook do **Smee.io** notifica meu **Jenkins** local sobre a alteração.
3. O **Jenkins** inicia a pipeline, que primeiro analisa o código com **SonarQube**.
4. Em seguida, a pipeline constrói uma imagem **Docker** da aplicação.
5. A imagem é escaneada em busca de vulnerabilidades pelo **Trivy**.
6. Se segura, a imagem é enviada para o **Docker Hub**.
7. O **Helm** é acionado para fazer o deploy da nova versão no cluster **Kubernetes**.
8. Ao final, uma notificação de sucesso ou falha é enviada para um canal no **Discord**.

```mermaid
flowchart

A[ALtero o repositório local com o código API] --> B[Envio, via push, para o GitHub]
B --> C[Webhook com Smee.io notifica o Jenkins do novo commit]
C --> D[O Jenkins inicia a pipeline, analisando o código com SonarQube]
D --> K[O relatório do SonarQube é exibido no Console Output]
K --> E
D --> E[Sucesso! A pipeline constrói a imagem Docker da aplicação]
E --> G[A imagem é escaneada pelo Trivy]
G --> L[Encontradas vulnerabilidades CRÍTICAS com correção disponível]
L --> F[Falha! O deploy é interrompido e o log é exibido no Console Output]
G --> H[Sem vulnerabilidades! A imagem é enviada para o Docker Hub]

H --> I[O Helm é acionado para fazer o deploy da nova versão no cluster Kubernetes]
I --> J[Através do NGrok, uma notificação de Sucesso ou Falha é disparada para o Discord]
F --> J
```

[⬆️ Voltar ao menu](#navegação)

<br>

---


## Fase 1: Preparação do Ambiente de Desenvolvimento

A base de qualquer projeto de automação é um ambiente local funcional e bem configurado.

1. **Código e Versionamento**: O código da API foi versionado com Git e hospedado no GitHub, essencial para a CI.
2. **Validação Local da API**: Para garantir que a aplicação funcionava antes de qualquer outra coisa, executei os seguintes passos:

   ```bash
   # Navegar para a pasta do backend
   cd backend

   # Criar um ambiente virtual. Esta é uma prática essencial em Python para isolar
   # as dependências de cada projeto.
   python -m venv venv

   # Ativar o ambiente virtual
   source venv/bin/activate

   # Instalar as bibliotecas Python necessárias para a API
   pip install -r requirements.txt

   # Iniciar o servidor de desenvolvimento.
   # Uvicorn é um servidor ASGI (Asynchronous Server Gateway Interface),
   # necessário para rodar frameworks assíncronos como o FastAPI.
   # A flag --reload é indispensável para desenvolvimento, pois reinicia
   # o servidor automaticamente sempre que um arquivo .py é alterado.
   uvicorn main:app --reload
   ```

   Com a API rodando e acessível em `http://127.0.0.1:8000/docs`, chegou a hora de  prosseguir.


[⬆️ Voltar ao menu](#navegação)

<br>

---


## Fase 2: Containerização Profissional com Docker

Containerizar não é apenas rodar um `docker build`. É sobre criar imagens otimizadas, seguras e pequenas.

### O Dockerfile Otimizado

Criei um `Dockerfile` pensando em performance e no cache de camadas do Docker.

```dockerfile
# /backend/Dockerfile

# Etapa 1: Imagem Base
# Utilizei a imagem 'python:3.9-slim' por ser uma versão enxuta,
# o que diminui a superfície de ataque e o tamanho final da imagem.
FROM python:3.9-slim

# Etapa 2: Diretório de Trabalho
# Define o diretório de trabalho padrão. Isso é uma boa prática para
# não poluir o diretório raiz do container.
WORKDIR /app

# Etapa 3: Instalação de Dependências com otimização de cache
# Copio inicialmente apenas o requirements.txt para aproveitar o cache do Docker.
# Alterações no código-fonte não afetam esta camada, otimizando futuros builds.
COPY requirements.txt .

# Atualizo o sistema e instalo as dependências Python.
RUN apt-get update && apt-get upgrade -y && apt-get clean && \
    pip install --no-cache-dir -r requirements.txt

# Etapa 4: Cópia do Código
# Agora copio o resto do código. Qualquer alteração aqui invalidará
# apenas o cache desta camada e das subsequentes.
COPY . .

# Etapa 5: Comando de Execução
# Expõe a aplicação na porta 8000 e no host 0.0.0.0,
# que é essencial para que a aplicação seja acessível de fora do container.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### O `.dockerignore`

Para evitar que arquivos desnecessários (como ambientes virtuais, cache do Python ou o próprio diretório `.git`) fossem copiados para a imagem, criei um arquivo `.dockerignore`.

```dockerignore
__pycache__/
*.pyc
.git
.venv
*.md
```

Com tudo pronto, construí e publiquei a imagem no Docker Hub.


[⬆️ Voltar ao menu](#navegação)

<br>

---


## Fase 3: Deploy no Kubernetes: A Forma Manual

Antes de automatizar com o Jenkins, fiz o deploy manualmente para entender profundamente os recursos do Kubernetes.

### A Arquitetura do Deploy

O fluxo de uma requisição até a aplicação dentro do Kubernetes funciona assim:

`Usuário Externo → Ingress → Service → Pod (Container)`

* **Deployment**: É a receita que diz ao Kubernetes como rodar minha aplicação: qual imagem usar (`viniciusemanuelds/projeto-devops`) e quantas réplicas (`replicas: 2`) manter sempre em execução. A seção `selector.matchLabels` é crucial, pois ela conecta o Deployment aos Pods que ele deve gerenciar.
* **Service**: Cria um ponto de acesso interno e estável (um DNS interno) para os Pods. Os IPs dos Pods mudam. O Service provê um endereço fixo. Usei o tipo `ClusterIP`, que o torna acessível apenas de dentro do cluster.
* **Ingress**: É o porteiro do cluster. Ele expõe rotas HTTP/HTTPS para os Services. Optei pelo Ingress em vez do `NodePort` porque ele é muito mais poderoso: permite roteamento baseado em domínio (`projeto.localhost`), centraliza o gerenciamento de SSL e se integra a controladores de tráfego avançados como o Traefik (padrão no Rancher Desktop).

Apliquei os manifestos no cluster com `kubectl apply -f <projeto-devops.yaml> -n devops`, e a aplicação ficou disponível.


[⬆️ Voltar ao menu](#navegação)

<br>

---


## Fase 4 e 5: Automação com Jenkins e Pipeline as Code

Aqui, o trabalho manual acaba e a automação começa. O objetivo é tratar a pipeline como código (`Pipeline as Code`), versionando-a junto com a aplicação no `Jenkinsfile`.

### Configuração do Jenkins

A preparação do Jenkins envolveu:

1. **Instalação e Agentes**: Instalei o Jenkins e configurei um agente no WSL2 para ter um ambiente Linux limpo e com acesso nativo ao Docker.
2. **Plugins**: Instalei os plugins essenciais: `Docker Pipeline`, `Kubernetes CLI Plugin`, `Git Plugin`, `SonarQube Scanner` e `Discord Notifier`.
3. **Credenciais**: Cadastrei de forma segura as credenciais do GitHub (Chave SSH), Docker Hub (Usuário/Senha), SonarQube (Token) e Kubeconfig.

### O Jenkinsfile Detalhado

```groovy
//Jenkisfile
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
}

```

* **Referência em Vídeo:** Para a construção e deploy dessa pipeline, esse vídeo foi indispensável para clarear o passo a passo: [O que é Jenkins | Guia prático para começar com Jenkins](https://www.youtube.com/watch?v=mvtVL5eivzo&t).


[⬆️ Voltar ao menu](#navegação)

<br>

---


# Desafios Extras: Construindo uma Pipeline de Nível Profissional

Com a base sólida, adicionei etapas avançadas para simular um ambiente DevSecOps real.

<br>

## DevSecOps 1: Análise Estática de Código (SAST) com SonarQube

O SonarQube olha para o *meu* código. Ele faz uma Análise Estática de Segurança da Aplicação (SAST) para encontrar bugs, "code smells" (más práticas) e vulnerabilidades como injeção de SQL ou senhas hard-coded.

**Implementação:**

1. **SonarQube Server**: Subi o SonarQube via Docker: `docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community`.
2. **Configuração no Jenkins**: Configurei a URL do servidor e o token de autenticação no Jenkins.
3. **Estágio na Pipeline**: Adicionei um estágio para executar a análise antes de construir a imagem.

<!-- end list -->

```groovy
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
```

**Problemas Resolvidos:** A integração teve seus desafios, como erros de conexão (`host.docker.internal` não funciona bem no WSL2, usei `localhost`) e a necessidade de configurar o `sonar-scanner` manualmente no agente Jenkins.

[⬆️ Voltar ao menu](#navegação)

<br>


## DevSecOps 2: Análise de Vulnerabilidades com Trivy

**Por quê?** Enquanto o SonarQube olha para o *meu* código, o Trivy olha para as dependências. Uma aplicação pode ser funcional, mas suas dependências podem conter falhas de segurança conhecidas (CVEs). Escanear a imagem Docker é um passo crítico de "shift-left security", ou seja, trazer a segurança para o início do processo.

**Implementação:** Adicionei um estágio no Jenkins que roda o Trivy logo após o build da imagem.

```groovy
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

```

> **Decisão Arquitetural Importante:** Ao escanear, o Trivy encontrou uma vulnerabilidade crítica (`CVE-2023-45853`) no pacote `zlib1g` da imagem base. No entanto, a equipe do Debian marcou-a como `will_not_fix` (não será corrigida). Em um cenário real, isso exigiria uma análise de risco. Para este projeto, decidi aceitar o risco, pois o impacto era mínimo, e usei a flag `--ignore-unfixed` para que o Trivy só bloqueasse a pipeline por falhas que tivessem uma correção disponível.

[⬆️ Voltar ao menu](#navegação)

<br>


## Automação do Fluxo: Webhooks para GitHub (com Smee.io) e Notificações no Discord

**Por quê?** Uma pipeline só é verdadeiramente "contínua" se for disparada automaticamente. E para fechar o ciclo, ela deve notificar os interessados sobre seu resultado.

**Parte A: Gatilho do GitHub com Smee.io**
O desafio: meu Jenkins é local, o GitHub não consegue alcançá-lo. A solução: um cliente de túnel/relay. Usei o **Smee.io**, uma ferramenta recomendada pelo próprio GitHub para desenvolvimento local.

1. **Criei um Canal**: Acessei [smee.io](https://smee.io) e criei um novo canal, que me deu uma URL pública única.
2. **Configurei o Webhook no GitHub**: Apontei o webhook do meu repositório para essa URL do Smee.
3. **Rodei o Cliente Local**: No meu terminal, rodei o comando:
   `npx smee -u https://smee.io/SEU_CANAL_AQUI -t http://localhost:8080/github-webhook/`
   Este cliente ouve o canal público do Smee e retransmite os eventos para o meu Jenkins local.

**Parte B: Notificações no Discord com Ngrok**

Para enviar notificações ao Discord diretamente do Jenkins, utilizei um webhook do Discord configurado com o serviço do  **Ngrok** , permitindo expor o Jenkins rodando localmente ao ambiente externo.

1. **Webhook no Discord**
   * No canal desejado, criei um webhook pela opção:
     * `Configurações do canal → Integrações → Webhooks → Novo webhook`.
   * Copiei a URL gerada pelo Discord.
2. **Configuração do Ngrok**
   * Iniciei o Ngrok para expor localmente o Jenkins na porta correta:
     `ngrok http 8081`
   * Copiei a URL pública fornecida pelo Ngrok.
3. **Uso no Jenkins**
   * Configurei a pipeline para enviar notificações POST para o webhook do Discord sempre que o pipeline finaliza com sucesso ou falha, utilizando a URL pública do Ngrok.

```groovy
    post {
        success {
            script {
                def chuck = chuckNorris()
                def discordWebhook = 'SUA_URL_DISCORD'
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
                def discordWebhook = 'SUA_URL_DISCORD'
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
```

[⬆️ Voltar ao menu](#navegação)

<br>



## Infraestrutura como Código Avançada: Deploy com Helm

**Por quê?** Gerenciar múltiplos arquivos YAML do Kubernetes é difícil e propenso a erros. O Helm é o gerenciador de pacotes do K8s, permitindo empacotar toda a aplicação em um "Chart" reutilizável e versionável.

**Implementação:**

1. **Criei um Helm Chart**: Estruturei meus manifestos em um diretório `helm-projeto/`, usando variáveis de template (ex: `{{ .Values.image.tag }}`) em vez de valores fixos.
2. **Ajustei a Pipeline**: Criei um novo estágio que usa o comando `helm` em vez de `kubectl`.

<!-- end list -->

```groovy
stage('Deploy com Helm') {
	steps {
		withKubeConfig([credentialsId: 'kubeconfig']) {
			sh """
			helm upgrade --install devops-helm ./helm-projeto \
				--namespace devops \
				--set image.repository=${IMAGE_NAME} \
				--set image.tag=${env.BUILD_ID}
			"""
		}
	}
}
```

**Aprendizados com Helm**: O diagnóstico de templates com `helm template --debug` foi essencial. Enfrentei e resolvi erros comuns, como a imutabilidade do `selector` em um Deployment e a necessidade de gerenciar os releases do Helm de forma separada dos deploys manuais com `kubectl`.

* **Referência em Vídeo:** Para entender a estrutura de um Chart e os comandos do Helm, este vídeo foi um ótimo ponto de partida: [Guia Helm: Como simplificar o deploy no Kubernetes](https://www.youtube.com/watch?v=VTQpe-ZRgsk&t).

[⬆️ Voltar ao menu](#navegação)

<br>

---

## Conclusão e Principais Aprendizados

Esta jornada foi muito além de simplesmente aprender ferramentas. Foi sobre internalizar os princípios da cultura DevOps e DevSecOps.

* **Automação**: Cada hora gasta automatizando uma tarefa manual é recuperada dezenas de vezes, liberando tempo para focar em melhorias e inovação.
* **Segurança**: Integrar Trivy e SonarQube desde o início me provou que segurança não é uma etapa final, mas uma responsabilidade contínua e integrada ao fluxo de desenvolvimento.
* **Código**: Tratar a infraestrutura (`YAMLs`, `Helm Charts`) e a pipeline (`Jenkinsfile`) como código tornou o sistema transparente, versionável e muito mais fácil de manter e depurar.

Este projeto solidificou minha base técnica e, mais importante, a mentalidade necessária para construir e manter sistemas de software modernos, resilientes e seguros.

[⬆️ Voltar ao menu](#navegação)
