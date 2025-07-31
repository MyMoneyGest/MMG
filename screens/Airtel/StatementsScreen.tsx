// screens/Airtel/StatementsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const months = [
  'Janvier', 'Février', 'Mars', 'Avril',
  'Mai', 'Juin', 'Juillet', 'Août',
  'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const currentYear = new Date().getFullYear();
const last30Years = Array.from({ length: 30 }, (_, i) => currentYear - i);

const ITEMS_PER_PAGE = 4;

const StatementsScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [searchYear, setSearchYear] = useState('');
  const [page, setPage] = useState(0);

  const [buttonScale] = useState(new Animated.Value(1));

  useEffect(() => {
    // Load last selected year
    AsyncStorage.getItem('lastSelectedYear').then((year) => {
      if (year && last30Years.includes(Number(year))) {
        setSelectedYear(year);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('lastSelectedYear', selectedYear);
  }, [selectedYear]);

  // Recherche par intervalle ex: "2015-2020"
  const filteredYears = useMemo(() => {
    if (!searchYear) return last30Years.map(String);
    const parts = searchYear.split('-').map(p => p.trim());
    if (parts.length === 2) {
      const start = Number(parts[0]);
      const end = Number(parts[1]);
      if (
        !isNaN(start) &&
        !isNaN(end) &&
        start >= 1900 &&
        end <= 2100 &&
        start <= end
      ) {
        // Filter years in range
        return last30Years
          .filter(y => y >= start && y <= end)
          .map(String);
      }
      return [];
    }
    // Sinon, simple année
    const numYear = Number(searchYear);
    if (isNaN(numYear) || numYear < 1900 || numYear > 2100) return [];
    return [searchYear];
  }, [searchYear]);

  const displayYear = filteredYears.length === 1 ? filteredYears[0] : selectedYear;

  // Pagination des mois
  const totalPages = Math.ceil(months.length / ITEMS_PER_PAGE);
  const currentMonths = months.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onYearPress = (year: string) => {
    animateButton();
    setSelectedYear(year);
    setSearchYear('');
    setPage(0);
  };

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[baseStyles.container, themeStyles.container]}>
      <ScrollView contentContainerStyle={themeStyles.content}>
        <Text style={themeStyles.title}>Mes relevés mensuels</Text>

        <TextInput
          style={themeStyles.input}
          placeholder="Rechercher une année ou intervalle (ex: 2018 ou 2015-2020)"
          placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          keyboardType="numeric"
          maxLength={9}
          value={searchYear}
          onChangeText={setSearchYear}
          returnKeyType="done"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={baseStyles.yearPicker}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          {filteredYears.length === 0 && (
            <Text style={themeStyles.errorText}>
              Année invalide ou aucun résultat
            </Text>
          )}

          {filteredYears.map((year) => {
            const isSelected = year === selectedYear && !searchYear;
            return (
              <Animated.View
                key={year}
                style={{ transform: [{ scale: isSelected ? buttonScale : 1 }] }}
              >
                <TouchableOpacity
                  onPress={() => onYearPress(year)}
                  style={[
                    baseStyles.yearButton,
                    isSelected ? themeStyles.yearButtonSelected : themeStyles.yearButton,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      baseStyles.yearText,
                      isSelected ? themeStyles.yearTextSelected : themeStyles.yearText,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        {(filteredYears.length === 1 || !searchYear) && (
          <>
            <Text style={themeStyles.subTitle}>
              Relevés pour l'année {displayYear}
            </Text>

            {currentMonths.map((month, index) => (
              <View key={index} style={[baseStyles.monthRow, themeStyles.monthRow]}>
                <Text style={[baseStyles.monthText, themeStyles.monthText]}>
                  {month} {displayYear}
                </Text>
                <TouchableOpacity
                  style={[baseStyles.downloadButton, themeStyles.downloadButton]}
                  onPress={() =>
                    alert(`Téléchargement PDF ${month} ${displayYear} (à implémenter)`)
                  }
                >
                  <Text style={[baseStyles.downloadText, themeStyles.downloadText]}>
                    Télécharger PDF
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Pagination mois */}
            <View style={baseStyles.pagination}>
              <TouchableOpacity
                disabled={page === 0}
                onPress={() => setPage(page - 1)}
                style={[
                  baseStyles.pageButton,
                  page === 0 && baseStyles.pageButtonDisabled,
                  themeStyles.pageButton,
                ]}
              >
                <Text
                  style={[
                    baseStyles.pageButtonText,
                    page === 0 && baseStyles.pageButtonTextDisabled,
                    themeStyles.pageButtonText,
                  ]}
                >
                  Précédent
                </Text>
              </TouchableOpacity>

              <Text style={[baseStyles.pageInfo, themeStyles.pageInfo]}>
                Page {page + 1} / {totalPages}
              </Text>

              <TouchableOpacity
                disabled={page === totalPages - 1}
                onPress={() => setPage(page + 1)}
                style={[
                  baseStyles.pageButton,
                  page === totalPages - 1 && baseStyles.pageButtonDisabled,
                  themeStyles.pageButton,
                ]}
              >
                <Text
                  style={[
                    baseStyles.pageButtonText,
                    page === totalPages - 1 && baseStyles.pageButtonTextDisabled,
                    themeStyles.pageButtonText,
                  ]}
                >
                  Suivant
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatementsScreen;

// Styles non thématisés (base commun)
const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  yearPicker: {
    marginBottom: 20,
  },
  yearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 6,
  },
  yearText: {
    fontWeight: '600',
    fontSize: 16,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  downloadText: {
    fontWeight: '700',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  pageButtonTextDisabled: {
    color: '#999',
  },
  pageInfo: {
    fontWeight: '600',
    fontSize: 14,
  },
});

// Styles clairs
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#E0F2F1',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00796B',
  },
  input: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#00796B',
    color: '#004D40',
  },
  yearButton: {
    backgroundColor: '#B2DFDB',
  },
  yearButtonSelected: {
    backgroundColor: '#00796B',
  },
  yearText: {
    color: '#004D40',
  },
  yearTextSelected: {
    color: '#E0F2F1',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#004D40',
  },
  monthRow: {
    backgroundColor: '#ffffff',
  },
  monthText: {
    color: '#004D40',
  },
  downloadButton: {
    backgroundColor: '#00796B',
  },
  downloadText: {
    color: '#E0F2F1',
  },
  errorText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#B71C1C',
  },
  pageButton: {
    backgroundColor: '#B2DFDB',
  },
  pageButtonText: {
    color: '#004D40',
  },
  pageInfo: {
    color: '#004D40',
  },
});

// Styles sombres
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#263238',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#80CBC4',
  },
  input: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: '#37474F',
    borderColor: '#80CBC4',
    color: '#B2DFDB',
  },
  yearButton: {
    backgroundColor: '#455A64',
  },
  yearButtonSelected: {
    backgroundColor: '#80CBC4',
  },
  yearText: {
    color: '#B2DFDB',
  },
  yearTextSelected: {
    color: '#263238',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#B2DFDB',
  },
  monthRow: {
    backgroundColor: '#37474F',
  },
  monthText: {
    color: '#B2DFDB',
  },
  downloadButton: {
    backgroundColor: '#80CBC4',
  },
  downloadText: {
    color: '#263238',
  },
  errorText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#EF9A9A',
  },
  pageButton: {
    backgroundColor: '#455A64',
  },
  pageButtonText: {
    color: '#B2DFDB',
  },
  pageInfo: {
    color: '#B2DFDB',
  },
});