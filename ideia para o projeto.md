## 🔎 Visão Geral do Sistema de Análise e Monitoramento de Links

### 📌 Objetivo

O sistema tem como objetivo analisar, classificar e monitorar **links** submetidos por usuários, identificando possíveis **ameaças**, **IPs maliciosos**, **localizações**, e **padrões de ataque** utilizando fontes de inteligência como **MaxMind**, **FireHOL**, e outras.

---

## 🧩 Estrutura do Projeto

```
/home/matheus/link_backend/
├── backend/               ← API em Node.js (NestJS)
├── frontend/              ← Interface do usuário (provavelmente React ou Next.js)
└── python-services/       ← Serviços auxiliares (scraping, IP checker, geolocalização)
```

---

## 🛠️ Tecnologias Utilizadas

### Backend (NestJS)

* NestJS com módulos organizados por funcionalidades (clean architecture)
* Banco de dados: **MongoDB** com uso de **migrations**
* Integração com serviços externos: MaxMind, FireHOL, etc.
* APIs REST para comunicação com o frontend
* Sistema de filas para tarefas assíncronas (ex: análise de links)

### Python Services

* Scripts para:

  * Verificação de IPs (MaxMind + FireHOL)
  * Geolocalização
  * Download e processamento de listas (como FireHOL)
* Comunicação com backend via REST ou fila (ex: RabbitMQ ou Redis pub/sub)

### Frontend

* Framework: **React** ou **Next.js**
* Visualizações de dados com:

  * **Recharts** ou **Chart.js** para gráficos
  * **Leaflet.js** ou **Mapbox GL** para mapa de calor
  * **Tailwind CSS** ou **Chakra UI** para UI
* Consumo das APIs do backend para exibir dados em tempo real

---

## 🔄 Funcionamento Geral

1. **Usuário envia um link pelo frontend**

   * O frontend envia esse link para a API do backend (`/analyze`)

2. **Backend processa e delega tarefas**

   * Salva o link e dispara processos assíncronos (via fila)
   * Chama serviços Python (via API ou subprocesso) para:

     * Extrair IPs e domínios do link
     * Verificar se o IP/domínio está em alguma blacklist (FireHOL)
     * Obter geolocalização com MaxMind
   * Armazena os resultados no MongoDB com metadados estruturados

3. **Dados analisados são salvos no banco**

   * Estrutura de dados com status, risco, país de origem, ASN, etc.

4. **Frontend consome os dados e os exibe ao usuário**

   * Visualizações:

     * **Gráfico de barras**: países mais frequentes
     * **Gráfico de pizza**: proporção de links seguros vs maliciosos
     * **Mapa de calor**: localização dos IPs maliciosos
     * **Lista**: todos os links analisados com detalhes (tabela)
     * **Gráfico de linhas**: volume de links analisados por dia
     * **Alertas**: IPs encontrados em listas negras (ex: FireHOL)

---

## 🧠 Inteligência do Sistema

* Fontes externas:

  * ✅ **MaxMind GeoLite2** (geolocalização IP)
  * ✅ **FireHOL IP Lists** (blacklist de IPs maliciosos)
  * (❌) **AbuseIPDB** (opcional, mas talvez dispensável com FireHOL e MaxMind)
* Sistema irá cruzar informações entre as fontes para aumentar precisão

---

## 🔒 Segurança

* IPs maliciosos bloqueados ou alertados no sistema
* Monitoramento contínuo de novos links
* Logs e auditoria no banco de dados

---

## 🔮 Possibilidades futuras

* Implementar **autenticação de usuários**
* Sistema de **notificações** para alertar sobre ameaças
* Exportação de relatórios em PDF/CSV
* Modo “detecção ativa” em redes locais
* Dashboard em tempo real com WebSockets