
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

## 📸 Prints recomendados

* Console do Jenkins com stages finalizados
* Docker Hub com a imagem publicada
* Kubernetes com pods `Running`
* Swagger da API acessível via `projeto.localhost`

---

## 🎯 Próximo passo

Fase 5 — Integrações adicionais:

* Scanner de vulnerabilidades com Trivy
* Notificação via Slack/Discord
* Validação pós-deploy (`rollout status`)
* Chuck Norris pós-build (extra)

```

---

Se quiser, posso gerar esse markdown como arquivo `README_FASE4.md`. Deseja isso? Ou quer partir direto pra Fase 5?
```
