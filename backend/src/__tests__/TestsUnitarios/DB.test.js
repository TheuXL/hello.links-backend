const mongoose = require('mongoose');
const connectDB = require('@/config/db');
const User = require('@/models/User');
const Link = require('@/models/Link');
const Click = require('@/models/Click');
const LinkEdit = require('@/models/LinkEdit');

describe('Verificação de Conexão e Schema do Banco de Dados', () => {
  let db;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    db = mongoose.connection.db;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('deve se conectar ao MongoDB com sucesso', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  describe('Validações de Schema', () => {
    let collectionNames;

    beforeAll(async () => {
        const collections = await db.listCollections().toArray();
        collectionNames = collections.map(c => c.name);
    });

    it('deve ter uma coleção "users" com o schema correto', async () => {
      expect(collectionNames).toContain('users');
      const userSchemaPaths = Object.keys(User.schema.paths);
      expect(userSchemaPaths).toEqual(
        expect.arrayContaining(['name', 'email', 'passwordHash', 'plan', 'createdAt'])
      );
    });

    it('deve ter uma coleção "links" com o schema correto', async () => {
      expect(collectionNames).toContain('links');
      const linkSchemaPaths = Object.keys(Link.schema.paths);
      expect(linkSchemaPaths).toEqual(
        expect.arrayContaining(['userId', 'linkType', 'originalUrl', 'content', 'alias', 'passwordHash', 'clickCount', 'createdAt'])
      );
    });
    
    it('deve ter uma coleção "clicks" com o schema correto', async () => {
      expect(collectionNames).toContain('clicks');
      const clickSchemaPaths = Object.keys(Click.schema.paths);
      expect(clickSchemaPaths).toEqual(
        expect.arrayContaining([
          'linkId', 'userId', 'timestamp', 'ip', 'isBot', 'geo.country'
        ])
      );
    });
    
    it('deve ter uma coleção "linkedits" com o schema correto', async () => {
      expect(collectionNames).toContain('linkedits');
      const linkEditSchemaPaths = Object.keys(LinkEdit.schema.paths);
      expect(linkEditSchemaPaths).toEqual(
        expect.arrayContaining(['linkId', 'userId', 'timestamp', 'ipAddress', 'editType'])
      );
      expect(linkEditSchemaPaths.some(p => p.startsWith('changes.'))).toBe(true);
    });
  });
}); 