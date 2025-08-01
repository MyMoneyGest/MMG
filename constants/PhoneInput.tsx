import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

type PhoneInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
};

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChangeText, error, placeholder }) => {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.prefix}>+241</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder || 'ex: 060000000'}
          keyboardType="phone-pad"
          value={value}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^\d]/g, '');
            onChangeText(cleaned);
          }}
          maxLength={9}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
};

export default PhoneInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  prefix: {
    fontSize: 16,
    color: '#00796B',
    fontWeight: '600',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#333',
  },
  error: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 8,
    marginLeft: 4,
  },
});