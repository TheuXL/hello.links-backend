// This is an example migration file that could be used with a tool like 'migrate-mongo'.
// It documents the schema changes applied to the Mongoose models.
// A real data migration would require scripting the updates to existing documents.

module.exports = {
  async up(db, client) {
    // Migration for the 'users' collection
    // - Renamed 'password' to 'passwordHash'
    // - Added 'name' field
    await db.collection('users').updateMany(
      { password: { $exists: true } },
      { $rename: { 'password': 'passwordHash' } }
    );

    // Migration for the 'links' collection
    // - Renamed 'user' to 'userId'
    // - Renamed 'alias' to 'shortUrl'
    // - Added 'editableSlug' (String, unique, sparse)
    // - Added 'passwordHash' (String)
    // - Added 'clickCount' (Number, default: 0)
    // - Removed 'active' field
    await db.collection('links').updateMany({}, [
        { $set: { 
            userId: '$user',
            shortUrl: '$alias',
            clickCount: { $ifNull: [ "$clickCount", 0 ] }
        } },
        { $unset: ['user', 'alias', 'active'] }
    ]);
    
    // Create a unique sparse index for editableSlug
    await db.collection('links').createIndex({ editableSlug: 1 }, { unique: true, sparse: true });


    // Migration for the 'clicks' collection
    // - Renamed 'user' to 'userId'
    // - Renamed 'link' to 'linkId'
    // - Restructured 'device', 'os', 'browser' into a single 'device' object
    // - Added 'language' (String)
    // - Added 'redirectLatencyMs' (Number)
    // - Added fields to 'geo' object
    await db.collection('clicks').updateMany(
        { $or: [{ user: { $exists: true } }, { link: { $exists: true } }] },
        [{
            $set: {
                userId: '$user',
                linkId: '$link',
                device: {
                    type: '$device.type',
                    os: { $concat: [{ $ifNull: ['$os.name', ''] }, ' ', { $ifNull: ['$os.version', ''] }] },
                    browser: { $concat: [{ $ifNull: ['$browser.name', ''] }, ' ', { $ifNull: ['$browser.version', ''] }] }
                }
            }
        },
        { $unset: ['user', 'link', 'os', 'browser'] }]
    );
  },

  async down(db, client) {
    // Reverting the changes
    await db.collection('users').updateMany(
      { passwordHash: { $exists: true } },
      { $rename: { 'passwordHash': 'password' } }
    );
    
    await db.collection('links').updateMany({}, [
        { $set: { 
            user: '$userId',
            alias: '$shortUrl',
            active: true
        } },
        { $unset: ['userId', 'shortUrl', 'editableSlug', 'passwordHash', 'clickCount'] }
    ]);
    await db.collection('links').dropIndex('editableSlug_1');

    await db.collection('clicks').updateMany({}, [
        { $set: {
            user: '$userId',
            link: '$linkId',
            os: {}, // Data reconstruction is complex and may not be perfect
            browser: {},
        }},
        { $unset: ['userId', 'linkId', 'device', 'language', 'redirectLatencyMs'] }
    ]);
  }
}; 