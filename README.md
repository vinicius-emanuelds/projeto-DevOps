
# 🚀 Projeto DevOps - FastAPI com Jenkins, Docker e Kubernetes

Este projeto demonstra a construção de uma esteira CI/CD usando uma API em FastAPI, conteinerização com Docker, e orquestração via Kubernetes, com Jenkins como ferramenta central de automação.

---

## 🧱 Estrutura do Projeto

```
.
├── backend
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   ├── .dockerignore
│   └── ...
└── ...
````

---

## ✅ Fase 1 - Preparação

- ✅ Código da API clonado e testado localmente
- ✅ Repositório GitHub privado criado
- ✅ Execução local via `uvicorn` validada:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
````

* 🔗 Acesso em: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Fase 2 - Conteinerização com Docker

### 📄 Dockerfile

O Dockerfile está localizado em `/backend` e define a build da API com base no Python 3.9:

```Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 📂 .dockerignore

```dockerignore
__pycache__/
*.pyc
.git
*.md
```

### 🧪 Teste local do container

```bash
cd backend
docker build -t meu-backend:latest .
docker run -d -p 8000:8000 meu-backend:latest
```

Acesso: [http://localhost:8000/docs](http://localhost:8000/docs)

### ☁️ Push no Docker Hub

```bash
docker tag meu-backend:latest seuusuario/fastapi-app:latest
docker push seuusuario/fastapi-app:latest
```

🔗 Docker Hub: [https://hub.docker.com/r/seuusuario/projeto-devops](https://hub.docker.com/r/seuusuario/projeto-devops)

---

## 🚀 Fase 3 – Deploy manual no Kubernetes

Nesta fase, a aplicação FastAPI foi implantada em um cluster Kubernetes local (Rancher Desktop), utilizando recursos `Deployment`, `Service` e `Ingress`.

---

### 📁 Estrutura de Arquivos YAML

Os manifests estão organizados em `./k8s/`:

- `projeto-devops.yaml`: contém o `Deployment` e o `Service`
- `ingress.yaml`: expõe a aplicação via domínio interno com Traefik

---

### 🔧 Recursos Criados

#### 📦 Deployment

- Nome: `projeto-devops`
- Replicas: `2`
- Imagem: `viniciusemanuelds/projeto-devops:latest`
- Porta container: `8000`
- Labels: `app: fastapi`, `name: projeto-devops`
- Namespace: `devops`

#### 🌐 Service

- Tipo: `ClusterIP`
- Porta: `80 → 8000`
- Seleciona o app `fastapi`

#### 🌍 Ingress (Traefik)

- Host: `projeto.localhost`
- Path: `/ → service/projeto-devops`
- Tipo: `Ingress`
- Controlador: Traefik (padrão no Rancher Desktop)

---

### 🛠 Comandos Utilizados

```bash
# Criar namespace
kubectl create namespace devops

# Aplicar deployment e service
kubectl apply -f ./k8s/projeto-devops.yaml -n devops

# Aplicar Ingress
kubectl apply -f ./k8s/ingress.yaml -n devops

# Verificar recursos
kubectl get all -n devops
kubectl get ingress -n devops


✅ Verificação do funcionamento
A aplicação pode ser acessada via navegador:

🔗 http://projeto.localhost/docs

O Swagger da API FastAPI é carregado com sucesso, confirmando o roteamento via Traefik.

🧠 Observações Técnicas
O uso de Ingress permite simular uma arquitetura real com DNS e proxy reverso

A tag da imagem deve ser definida diretamente (latest, v1, etc.) — não suportado {{tag}}

As labels de Deployment.selector.matchLabels e Pod.metadata.labels precisam coincidir

Evitou-se o uso de NodePort para manter boa prática de exposição via Ingress Controller

Perfeito. Aqui está a documentação completa e profissional da **Fase 4 – Jenkins: Build + Push + Deploy**, incluindo um **guia básico de instalação e configuração do Jenkins** com foco prático e reprodutível.

---

````markdown
## 🔧 Fase 4 – Jenkins CI/CD (Build + Push + Deploy)

Nesta fase, foi implementada uma pipeline completa de CI/CD usando **Jenkins**, que automatiza o build da imagem Docker, faz o push para o Docker Hub e aplica o deploy no cluster Kubernetes local via `kubectl`.

---

### 📦 Estrutura geral da esteira

- **Pipeline Declarativa** (`Jenkinsfile`) com 3 stages:
  1. **Build** da imagem Docker com `docker.build`
  2. **Push** para Docker Hub (`latest` e `${BUILD_ID}`)
  3. **Deploy** automático no cluster Kubernetes (`kubectl apply`)
- Substituição dinâmica da tag da imagem no manifesto YAML (`{{tag}}`)
- Deploy realizado em namespace isolado: `devops`

---

## 🧭 Etapas de Instalação e Configuração do Jenkins

### 1. Instalação (Windows com WSL + Rancher Desktop)

- Instale o Jenkins localmente (via `.war` ou MSI)
- Crie um agente Jenkins conectado ao WSL com label `WSL_Ubuntu`
- Dê permissão para que o agente use Docker local
- Instale os plugins essenciais:
  - **Docker Pipeline**
  - **Kubernetes CLI Plugin**
  - **Git Plugin**
  - (opcional) **ChuckNorris Plugin**

---

### 2. Configuração necessária

- **Docker Hub Credentials**:
  - Tipo: `Username with Password`
  - ID: `dockerhub`

- **GitHub Credentials**:
  - Tipo: `SSH Username with Private Key`
  - ID: `git`

- **Kubeconfig Credentials**:
  - Tipo: `Kubeconfig File`
  - ID: `kubeconfig`

- **Agente com Docker configurado** (dentro do WSL)
- Label: `WSL_Ubuntu`

---

## 🧱 Jenkinsfile

```groovy
pipeline {
    agent { label 'WSL_Ubuntu' }

    stages {
        stage('Build do Backend') {
            steps {
                script {
                    dockerapp = docker.build("viniciusemanuelds/projeto-devops:${env.BUILD_ID}", '-f ./src/backend/Dockerfile ./src/backend')
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
        failure {
            echo 'Build falhou. Mas Chuck Norris nunca falha.'
        }
    }
}
````

---

### 📄 Estrutura do manifesto Kubernetes (`projeto-devops.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: projeto-devops
  namespace: devops
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fastapi
  template:
    metadata:
      labels:
        app: fastapi
    spec:
      containers:
      - name: projeto-devops
        image: viniciusemanuelds/projeto-devops:{{tag}}
        ports:
        - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: projeto-devops
  namespace: devops
spec:
  selector:
    app: fastapi
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: projeto-devops-ingress
  namespace: devops
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
    - host: projeto.localhost
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: projeto-devops
                port:
                  number: 80
```

---

## ✅ Resultado final

Após cada `git push` ou build manual:

* A imagem da API é reconstruída e publicada no Docker Hub
* A tag `latest` e o número do build (`:5`, `:6`, etc.) são atribuídos
* O cluster Kubernetes aplica o novo deploy com a imagem atualizada
* A aplicação está acessível via:

🔗 [http://projeto.localhost/docs](http://projeto.localhost/docs)

---

## 🔐 Desafio Extra: Scan de Vulnerabilidades com Trivy

### 🎯 Objetivo

Integrar o **Trivy** à pipeline Jenkins para escanear automaticamente as imagens Docker geradas e **bloquear o deploy caso existam vulnerabilidades CRÍTICAS corrigíveis**.

---

### ⚙️ Etapas da Implementação

1. **Instalação do Trivy**
   O Trivy foi utilizado via container, sem instalação local, usando o seguinte comando base:

   ```bash
   docker run --rm \
     -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image nome-da-imagem
   ```

2. **Inclusão na pipeline Jenkins**
   Um novo `stage` foi adicionado no `Jenkinsfile`, antes do deploy, contendo:

   ```groovy
   stage('Scan de Vulnerabilidades com Trivy') {
       steps {
           script {
               def image = "viniciusemanuelds/projeto-devops:${env.BUILD_ID}"
               echo "🔍 Escaneando a imagem ${image} com Trivy..."

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
                   error "❌ Vulnerabilidades CRÍTICAS (com correção) encontradas na imagem Docker! Build bloqueado. Veja trivy-report.txt."
               } else {
                   echo "✅ Nenhuma vulnerabilidade crítica (corrigível) encontrada na imagem."
               }
           }
       }
   }
   ```

3. **Política de Segurança adotada**

   * **Gravidade avaliada:** Apenas CVEs com severidade `CRITICAL`;
   * **Critério de bloqueio:** Apenas se houver **patch disponível**;
   * **Relatório gerado:** `trivy-report.txt`.

---

### 🧠 Decisão Arquitetural

> **Optamos por manter a imagem base `python:3.9-slim`, mesmo apresentando uma vulnerabilidade crítica (`CVE-2023-45853`) no pacote `zlib1g`.**
> Esta decisão foi baseada em dois fatores:
>
> 1. A vulnerabilidade está marcada como `will_not_fix` pela equipe mantenedora do pacote no Debian.
> 2. O impacto no contexto do projeto é mínimo e sem exposição direta — portanto, aceitamos o risco controlado.
>
> A opção `--ignore-unfixed` do Trivy garante que apenas vulnerabilidades com correção disponível interrompam o pipeline.

---

Se quiser, posso gerar essa seção já formatada para o `README.md` também. Deseja isso?

Ótimo. Aqui está a documentação da **Fase Extra: Webhook com GitHub e Ngrok**, no padrão das fases anteriores:

---

## 🔁 Fase Extra: Integração com Webhook GitHub + Ngrok

### Objetivo

Automatizar a execução da pipeline Jenkins sempre que houver um push no repositório GitHub, mesmo com o Jenkins sendo executado localmente.

---

### 🧰 Pré-Requisitos

* Jenkins rodando localmente (porta `8081`)
* Conta no [Ngrok](https://ngrok.com/)
* Repositório GitHub já configurado com o Jenkinsfile

---

### ⚙️ Etapas da Configuração

#### 1. Instalar e autenticar o Ngrok (Windows)

```bash
winget install Ngrok.Ngrok
ngrok config add-authtoken <SEU_TOKEN_NGROK>
```

#### 2. Expor Jenkins via Ngrok

```bash
ngrok http 8081
```

> Guarde o endereço gerado, ex: `https://8cd4-2804-xyz.ngrok.io`

---

#### 3. Configurar Webhook no GitHub

* Acesse seu repositório → ⚙️ Settings → Webhooks → **Add webhook**
* **Payload URL:**
  `https://<NGROK_URL>/github-webhook/`
  Exemplo: `https://8cd4-2804-xyz.ngrok.io/github-webhook/`
* **Content type:** `application/json`
* **Secret:** (deixe vazio ou use um token simples)
* **Just the push event** (marcado)
* Clique em **Add webhook**

---

#### 4. Configurar o Job no Jenkins

* Em **Pipeline → Configure**
* Vá até **Build Triggers**

  * Marque: `GitHub hook trigger for GITScm polling`

---

### 📦 Entregável

* Push no GitHub aciona automaticamente o Jenkins, que realiza build, push da imagem e deploy no Kubernetes.

---

> 💡 **Decisão técnica**
>
> A exposição do Jenkins foi feita via **Ngrok**, evitando configurações complexas de rede ou servidores externos. Essa abordagem é suficiente para ambientes locais e testes de integração contínua.

---

Pronto para o próximo desafio extra?

