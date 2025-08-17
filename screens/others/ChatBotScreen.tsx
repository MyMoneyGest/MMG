// screens/Others/ChatBotScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import faq from '../../constants/faq';

const ChatBotScreen = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');

  const handleAsk = () => {
    if (question.trim() === '') return;

    const q = question.toLowerCase();

    const match = faq.find(f =>
      f.keywords.some(k => q.includes(k))
    );

    setResponse(match ? match.response : "Je n’ai pas compris votre question. Essayez avec d'autres mots.");
  }
  
  const suggestions = [
  "Comment ajouter un nouveau compte Airtel Money ?",
  "Comment créer un coffre partagé ?",
  "Comment changer mon mot de passe ?",
  "Comment envoyer de l’argent à un bénéficiaire ?",
  "Comment télécharger un relevé PDF ?",
];

const handleSuggestionClick = (suggestion: string) => {
  setQuestion(suggestion);
  const q = suggestion.toLowerCase();

  const match = faq.find(f =>
    f.keywords.some(k => q.includes(k))
  );

  setResponse(match ? match.response : "Je n’ai pas compris votre question.");
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Assistant MyMoneyGest</Text>
          <Text style={styles.subtitle}>Posez votre question 👇</Text>

          <TextInput
            placeholder="Ex: Comment créer un coffre ?"
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={handleAsk}
          />

          <TouchableOpacity style={styles.button} onPress={handleAsk}>
            <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Envoyer</Text>
          </TouchableOpacity>

            <Text style={styles.suggestionTitle}>Suggestions :</Text>
            <View style={styles.suggestionContainer}>
            {suggestions.map((s, index) => (
                <TouchableOpacity key={index} onPress={() => handleSuggestionClick(s)} style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
            ))}
            </View>


          {response !== '' && (
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatBotScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  responseBox: {
    marginTop: 24,
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 10,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
  },
  suggestionTitle: {
  marginTop: 20,
  marginBottom: 6,
  fontSize: 16,
  fontWeight: '600',
  color: '#0f172a',
},

suggestionContainer: {
  flexDirection: 'column',
  gap: 8,
},

suggestionButton: {
  backgroundColor: '#f1f5f9',
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 8,
  borderColor: '#e2e8f0',
  borderWidth: 1,
},

suggestionText: {
  color: '#1e293b',
  fontSize: 14,
},
});