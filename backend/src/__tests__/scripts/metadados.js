// @ts-check
// Este script serve para popular o banco de dados com dados de teste (metadados).
// Para executar:
// 1. Navegue até a pasta 'backend' no terminal.
// 2. Execute o comando: node src/__tests__/scripts/metadados.js

const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Link = require('../../models/Link');
const linkService = require('../../services/linkService');
const axios = require('axios'); // Para fazer as requisições de simulação

// Carrega as variáveis de ambiente do .env que está na raiz do diretório 'backend'
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// DEBUG: Log the MONGODB_URI immediately after dotenv loads
console.log('MONGODB_URI do metadados.js:', process.env.MONGODB_URI);

const USER_EMAIL = 'matheuss.devv@gmail.com';
const USER_PASSWORD = '123456789';

const linksData = [
    {
        originalUrl: 'https://github.com/matheusmilke',
        alias: 'github-matheus',
        linkType: 'redirect',
        description: 'Link para o perfil principal no GitHub.'
    },
    {
        originalUrl: 'https://www.linkedin.com/in/matheus-milke/',
        alias: 'linkedin-profissional',
        linkType: 'redirect',
        password: 'senha-super-secreta',
        description: 'Link protegido por senha para o LinkedIn.'
    },
    {
        originalUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        linkType: 'image',
        content: {
            altText: 'Um fundo gradiente colorido e abstrato'
        },
        description: 'Link que serve uma imagem diretamente.'
    },
    {
        originalUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        linkType: 'file',
        content: {
            filename: 'documento-exemplo.pdf'
        },
        description: 'Link para download direto de um arquivo PDF.'
    },
    {
        originalUrl: 'https://gist.github.com/matheusmilke/c18d368b3684a2d7d5b1b4a6b281886c',
        alias: 'meu-gist-nodejs',
        linkType: 'redirect',
        description: 'Link para um Gist com código Node.js.'
    },
    {
        originalUrl: 'https://meu-portfolio-site.com',
        alias: 'portfolio-dev',
        linkType: 'redirect',
        description: 'Link personalizado com palavra para o portfólio.'
    },
    {
        originalUrl: 'https://promo-de-ano-novo.com/oferta',
        alias: '20250101',
        linkType: 'redirect',
        description: 'Link promocional de ano novo, personalizado com número.'
    },
    {
        originalUrl: 'https://docs.google.com/document/d/12345-abcde',
        alias: null,
        linkType: 'redirect',
        description: 'Link para um documento privado, com alias gerado pelo sistema.'
    }
];

// Dados mocados para simulação de cliques
const mockClickData = [
    // Clicks normais de diferentes dispositivos e referers
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', referer: 'https://www.google.com/', language: 'en-US,en;q=0.9', ip: '192.168.1.10', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1', referer: 'https://www.facebook.com/', language: 'pt-BR,pt;q=0.9', ip: '203.0.113.45', lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo' },
    { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', referer: 'https://t.co/', language: 'es-ES,es;q=0.9', ip: '198.51.100.20', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
    { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', referer: null, language: 'fr-FR,fr;q=0.9', ip: '10.0.0.5', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0', referer: 'https://www.bing.com/', language: 'de-DE,de;q=0.9', ip: '172.16.0.1', lat: 52.5200, lng: 13.4050, timezone: 'Europe/Berlin' },
    { userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36', referer: 'https://www.instagram.com/', language: 'it-IT,it;q=0.9', ip: '103.20.20.20', lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome' },
    
    // Simulações de bot
    { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', referer: null, isBot: true, ip: '66.249.66.1', lat: 37.7749, lng: -122.4194, timezone: 'America/Los_Angeles' },
    { userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', referer: null, isBot: true, ip: '157.55.39.1', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },

    // Clicks com UTMs
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', referer: 'https://campaigns.email.com/newsletter', utm: { source: 'email', medium: 'newsletter', campaign: 'black-friday-2024' }, ip: '192.168.1.11' },
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1', referer: 'https://ads.google.com/', utm: { source: 'google', medium: 'cpc', campaign: 'product-launch', term: 'new product' }, ip: '203.0.113.46' },
    
    // Clicks com alta latência (simulados por delay no envio)
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', referer: 'https://www.google.com/', language: 'en-US,en;q=0.9', ip: '192.168.1.12', latency: 600 }, // High latency
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', referer: 'https://www.google.com/', language: 'en-US,en;q=0.9', ip: '192.168.1.13', latency: 750 }, // High latency
];

const NUM_CLICKS_PER_LINK = 20; // Aumentar o número de cliques por link para gerar mais dados

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('Conexão com o banco de dados estabelecida.');

        // 1. Encontrar e remover o usuário existente para garantir um estado limpo
        let user = await User.findOne({ email: USER_EMAIL });
        if (user) {
            console.log(`Usuário ${USER_EMAIL} encontrado. Removendo para recriação...`);
            await User.deleteOne({ email: USER_EMAIL });
            console.log('Usuário removido com sucesso.');
        }

        // Criar o usuário
        console.log(`Criando usuário ${USER_EMAIL}...`);
        user = new User({
            name: 'Matheus Milke',
            email: USER_EMAIL,
            passwordHash: USER_PASSWORD, 
            plan: 'custom' // Para garantir que possa usar todas as features
        });
        await user.save();
        console.log('Usuário criado com sucesso.');

        // 2. Garantir que todos os links existam
        const createdLinks = [];
        console.log('Verificando e criando links com metadados...');
        for (const linkData of linksData) {
            let link = linkData.alias ? await Link.findOne({ alias: linkData.alias }) : null;

            if (link) {
                console.log(`- Alias '${link.alias}' já existe. Usando link existente.`);
                createdLinks.push(link);
            } else {
                const newLink = await linkService.createLink(
                    user,
                    linkData,
                    { ip: '127.0.0.1', userAgent: 'SeedScript/1.0' }
                );
                console.log(`- Link criado com alias: ${newLink.alias}`);
                createdLinks.push(newLink);
            }
        }
        console.log('Criação de links concluída!');

        // 3. Simular cliques para gerar metadados de tráfego
        console.log('Iniciando simulação de cliques para gerar metadados...');

        // @ts-ignore - O linter se confunde com o `axios.create` em CommonJS, mas o código é funcional.
        const api = axios.create({
            baseURL: `http://localhost:8000`, // Target the host-exposed port 8000
            validateStatus: () => true,
        });

        for (const link of createdLinks) {
            for (let i = 0; i < NUM_CLICKS_PER_LINK; i++) {
                const clickSim = mockClickData[i % mockClickData.length];
                
                console.log(`- Simulando clique no alias: ${link.alias} (click ${i + 1}/${NUM_CLICKS_PER_LINK})`);
                
                const headers = {
                    'User-Agent': clickSim.userAgent,
                    'Referer': clickSim.referer || '',
                    'Accept-Language': clickSim.language || 'en-US,en;q=0.9',
                };

                if (clickSim.ip) {
                    headers['X-Forwarded-For'] = clickSim.ip;
                }

                // Simulate high latency for specific clicks if 'latency' property is set
                if (clickSim.latency && clickSim.latency > 500) {
                  // This is a simple client-side delay; actual latency handling is on the backend
                  await new Promise(resolve => setTimeout(resolve, clickSim.latency));
                }

                await api.get(`/${link.alias}`, { headers });
            }
        }
        console.log('Simulação de cliques concluída!');

    } catch (error) {
        console.error('Ocorreu um erro durante a execução do script:', error);
    } finally {
        console.log('Aguardando 2 segundos para o processamento dos cliques em segundo plano...');
        setTimeout(async () => {
        await mongoose.disconnect();
        console.log('Conexão com o banco de dados fechada.');
        }, 2000);
    }
};

seedDatabase(); 