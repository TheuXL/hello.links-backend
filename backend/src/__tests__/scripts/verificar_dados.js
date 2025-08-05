// @ts-check
// Este script serve para verificar a existência de dados nas coleções do banco.
// Para executar:
// 1. Navegue até a pasta 'backend' no terminal.
// 2. Execute o comando: node src/__tests__/scripts/verificar_dados.js

require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Link = require('../../models/Link');
const Click = require('../../models/Click');
const LinkEdit = require('../../models/LinkEdit');

const verifyData = async () => {
    try {
        await connectDB();
        console.log('Conexão com o banco de dados estabelecida.');

        const userCount = await User.countDocuments();
        const linkCount = await Link.countDocuments();
        const clickCount = await Click.countDocuments();
        const linkEditCount = await LinkEdit.countDocuments();

        console.log('\n--- Contagem de Documentos no Banco de Dados ---');
        console.log(`Coleção 'users': ${userCount} documento(s)`);
        console.log(`Coleção 'links': ${linkCount} documento(s)`);
        console.log(`Coleção 'clicks': ${clickCount} documento(s)`);
        console.log(`Coleção 'linkEdits': ${linkEditCount} documento(s)`);

        if (linkCount > 0 && clickCount > 0) {
            console.log('\nConfirmação: Os dados foram salvos com sucesso!');
        } else {
            console.warn('\nAtenção: Parece que os scripts de população de dados ainda não foram executados ou falharam.');
        }

    } catch (error) {
        console.error('Ocorreu um erro durante a verificação:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nConexão com o banco de dados fechada.');
    }
};

verifyData(); 