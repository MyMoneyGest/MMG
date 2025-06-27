const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Remplace par le chemin exact de ta clé JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('Aucun utilisateur trouvé.');
    return;
  }

  const updates = snapshot.docs.map(async (doc) => {
    const userData = doc.data();
    const uid = doc.id;

    const updateData = {};

    if (userData.entrepriseId === uid || userData.entrepriseId === uid) {
    updateData.role = 'admin';
    updateData.type = 'entreprise';
    updateData.entrepriseId = userData.entrepriseId || userData.entrepriseId || uid;
    } else {
    updateData.role = 'collaborator';
    updateData.type = 'individual';
    
    const eid = userData.entrepriseId || userData.entrepriseId;
    if (eid) {
        updateData.entrepriseId = eid;
    }
    }


    console.log(`Mise à jour de ${uid} avec`, updateData);
    return usersRef.doc(uid).update(updateData);
  });

  await Promise.all(updates);
  console.log('✅ Tous les utilisateurs ont été mis à jour.');
}

updateUsers().catch((err) => {
  console.error('❌ Erreur lors de la mise à jour des utilisateurs :', err);
});