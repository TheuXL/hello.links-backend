require('dotenv').config();

module.exports = {
  // Carrega o dotenv para garantir que as variáveis de ambiente (.env) estejam disponíveis
  setupFiles: ['dotenv/config'],
  
  // Define o ambiente de teste
  testEnvironment: 'node',

  // Configura aliases de módulo para evitar caminhos relativos complexos
  // Agora você pode usar "@/models/userModel" em vez de "../../models/userModel"
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Aumenta o tempo limite para operações assíncronas como a conexão com o banco de dados
  testTimeout: 30000,
}; 