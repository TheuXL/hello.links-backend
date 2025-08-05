// Este script atualiza o plano de um usuário específico no banco de dados.
// Para executar:
// 1. Navegue até a pasta 'backend' no terminal.
// 2. Execute o comando: node src/__tests__/scripts/upgradeUserPlan.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const User = require('../../models/User');

const USER_EMAIL = 'matheuss.devv@gmail.com';
const NEW_PLAN = 'advanced'; // Planos disponíveis: 'free', 'basic', 'intermediate', 'advanced', 'custom'

const upgradePlan = async () => {
    try {
        await connectDB();
        console.log('Conexão com o banco de dados estabelecida.');

        const user = await User.findOne({ email: USER_EMAIL });

        if (!user) {
            console.error(`Erro: Usuário com o email "${USER_EMAIL}" não foi encontrado.`);
            return;
        }

        if (user.plan === NEW_PLAN) {
            console.log(`O usuário "${user.name}" (${user.email}) já está no plano "${NEW_PLAN}". Nenhuma alteração foi feita.`);
            return;
        }

        const oldPlan = user.plan;
        user.plan = NEW_PLAN;
        await user.save();

        console.log('Plano atualizado com sucesso!');
        console.log(`- Usuário: ${user.name} (${user.email})`);
        console.log(`- Plano antigo: ${oldPlan}`);
        console.log(`- Novo plano: ${user.plan}`);

    } catch (error) {
        console.error('Ocorreu um erro durante a atualização do plano:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Conexão com o banco de dados fechada.');
    }
};

upgradePlan(); 