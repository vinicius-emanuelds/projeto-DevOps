
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