# 🚀 Visão Geral do Sistema de Análise de Links

Este documento descreve a arquitetura, tecnologias e funcionamento do sistema de análise e monitoramento de links.

## 1. Arquitetura Geral

O sistema é composto por três componentes principais orquestrados com Docker Compose:

- **Frontend**: Uma aplicação Next.js (React) responsável pela interface do usuário, visualização de dados e interação com o backend.
- **Backend**: Uma API em Node.js com Express, que serve como o ponto central para o gerenciamento de dados, autenticação e comunicação com os outros serviços.
- **Serviços Python**: Um microsserviço em Python com FastAPI, especializado em tarefas de inteligência e análise, como geolocalização de IPs e verificação em blacklists.
- **Banco de Dados**: Um container MongoDB para persistência dos dados, compartilhado entre o backend e os serviços Python.

Os serviços se comunicam em uma rede Docker interna (`link-network`), garantindo um ambiente isolado e coeso.

## 2. Detalhes dos Componentes

### Frontend (`/frontend`)

- **Tecnologia**: Next.js 14 com TypeScript.
- **UI/Estilização**:
  - **Tailwind CSS**: Para estilização utilitária.
  - **Shadcn/UI**: Biblioteca de componentes pré-construídos e acessíveis.
  - **Framer Motion**: Para animações.
- **Visualização de Dados**:
  - **Recharts & Chart.js**: Para a criação de gráficos (barras, pizza, linhas).
  - **React Leaflet**: Para a exibição de mapas de calor (Geo-Heatmap).
- **Funcionalidades**:
  - Dashboard para visualização de estatísticas de links.
  - Autenticação de usuário (Login/Registro).
  - Submissão de links para análise.
  - Visualização de dados geográficos, fontes de tráfego, e comportamento do usuário.
- **Execução**: Roda na porta `3001` e se comunica com a API do backend.

### Backend (`/backend`)

- **Tecnologia**: Node.js com Express.js.
- **Banco de Dados**: MongoDB com Mongoose para modelagem dos dados.
- **Autenticação**: Baseada em `jsonwebtoken` (JWT) com senhas criptografadas usando `bcryptjs`.
- **Principais Dependências**:
  - `express`: Framework web.
  - `mongoose`: ORM para o MongoDB.
  - `jsonwebtoken` / `bcryptjs`: Para autenticação e segurança.
  - `axios`: Para comunicação com o serviço Python.
  - `nanoid`: Para geração de IDs curtos para os links.
  - `json2csv`, `pdfkit`: Para exportação de dados.
- **Estrutura**: O código é organizado em `controllers`, `models`, `routes`, `services` e `middlewares`, seguindo uma arquitetura de separação de responsabilidades.
- **Comunicação**: Expõe uma API REST na porta `3000` (mapeada para `8080` no host) e consome a API do serviço Python para tarefas de análise.
- **Observação**: O script de desenvolvimento (`npm run dev`) utiliza `cross-env`, que apresentou um erro de `Permission denied` no ambiente WSL. Isso pode ser resolvido garantindo que o executável tenha as permissões corretas (`chmod +x node_modules/.bin/cross-env`) ou substituindo-o por uma alternativa compatível.

### Serviços Python (`/python-services`)

- **Tecnologia**: Python com o framework FastAPI.
- **Funcionalidades**:
  - **Análise de IP**: Utiliza a biblioteca `geoip2` para obter dados de geolocalização a partir de um IP.
  - **Análise de User-Agent**: A biblioteca `user-agents` é usada para extrair informações do navegador e sistema operacional do cliente.
  - **Comunicação com o DB**: Usa `pymongo` para acessar diretamente o MongoDB, possivelmente para ler dados necessários para análise ou gravar resultados.
- **API**: Expõe uma API REST na porta `8000`, que é consumida internamente pelo backend Node.js.
- **Configuração**: O `docker-compose.yml` mostra que ele compartilha a mesma conexão com o MongoDB que o backend, permitindo uma troca de dados eficiente.

## 3. Fluxo de Funcionamento (Análise de Link)

1.  **Submissão**: O usuário insere um link na interface do **Frontend**.
2.  **Requisição**: O **Frontend** envia o link para a API do **Backend**.
3.  **Processamento Inicial**: O **Backend** recebe a requisição, salva o link no **MongoDB** com um status inicial (ex: "pendente") e gera um alias curto.
4.  **Delegação da Análise**: O **Backend** faz uma chamada HTTP para o **Serviço Python**, enviando os dados necessários para a análise (como o IP associado ao link/clique).
5.  **Análise de Inteligência**: O **Serviço Python** processa os dados:
    *   Consulta o banco de dados do MaxMind (`geoip2`) para obter a geolocalização.
    *   Verifica o IP contra as blacklists do FireHOL.
    *   Analisa o `User-Agent` para identificar o dispositivo e o navegador.
6.  **Armazenamento dos Resultados**: O serviço Python (ou o backend, após receber a resposta) atualiza o registro do link no **MongoDB** com os metadados enriquecidos (país, cidade, ASN, status de blacklist, etc.).
7.  **Visualização**: O **Frontend** consulta periodicamente (ou via WebSockets, no futuro) a API do **Backend** para obter os dados atualizados e exibe as informações nos dashboards, gráficos e mapas.

## 4. Configuração e Execução (Docker)

O `docker-compose.yml` automatiza a subida do ambiente completo:

- Inicia um container para o MongoDB.
- Constrói e inicia o container do Backend, injetando as variáveis de ambiente necessárias para a conexão com o banco de dados e com o serviço Python.
- Constrói e inicia o container do serviço Python.
- Constrói e inicia o container do Frontend.

Para iniciar todo o sistema, o comando `docker-compose up` no diretório raiz (`/home/matheus/link_backend/`) deve ser suficiente.

