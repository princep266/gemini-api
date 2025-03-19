import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const API_KEY = "AIzaSyBMrbfHkSND7MOCo0ML1GifyppVLZAC70o"; // Replace with your actual API key

interface FoodData {
  name: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

async function searchFood(query: string): Promise<FoodData[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Given the food query \"${query}\", provide nutritional information in strict JSON format:
                  [
                    {
                      \"name\": \"Food Name\",
                      \"calories\": number,
                      \"protein\": number,
                      \"fats\": number,
                      \"carbs\": number
                    }
                  ]
                  Return up to 5 relevant food items. Only return JSON, no extra text.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("No valid data found in API response");

    const jsonStartIndex = textResponse.indexOf("[");
    const jsonEndIndex = textResponse.lastIndexOf("]") + 1;

    if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error("Invalid JSON format");

    return JSON.parse(textResponse.slice(jsonStartIndex, jsonEndIndex));
  } catch (error) {
    console.error("Error fetching food data:", error);
    throw error;
  }
}

const FoodSearchScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [unit, setUnit] = useState("grams");

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a food name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await searchFood(query);
      setFoods(result);
      const initialQuantities = result.reduce((acc, item) => {
        acc[item.name] = 100; // Default quantity is 100g
        return acc;
      }, {} as { [key: string]: number });
      setQuantities(initialQuantities);
    } catch (err) {
      setError("Failed to fetch food data. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (foodName: string, change: number) => {
    setQuantities((prevQuantities) => {
      const newQuantity = Math.max(10, (prevQuantities[foodName] || 100) + change);
      return { ...prevQuantities, [foodName]: newQuantity };
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Nutrition Finder 🍏</Text>
      <TextInput
        style={styles.input}
        placeholder="Search food"
        placeholderTextColor="#aaa"
        value={query}
        onChangeText={setQuery}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#007BFF" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={foods}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          const quantity = quantities[item.name] || 100;
          const factor = quantity / 100;

          return (
            <View style={styles.foodContainer}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.calories}>🔥 {Math.round(item.calories * factor)} kcal - {quantity} {unit}</Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => handleQuantityChange(item.name, -10)} style={styles.quantityButton}>
                  <Text>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity.toString()}
                  onChangeText={(value) => handleQuantityChange(item.name, Number(value) - quantity)}
                />
                <TouchableOpacity onPress={() => handleQuantityChange(item.name, 10)} style={styles.quantityButton}>
                  <Text>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={unit}
                  style={styles.unitPicker}
                  dropdownIconColor="#000"
                  onValueChange={(itemValue) => setUnit(itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="g" value="g" />
                  <Picker.Item label="ml" value="ml" />
                </Picker>
              </View>

              <View style={styles.nutrientRow}>
                <View style={styles.nutrientBox}>
                  <Text>{(item.protein * factor).toFixed(1)}g Protein</Text>
                </View>
                <View style={styles.nutrientBox}>
                  <Text>{(item.fats * factor).toFixed(1)}g Fats</Text>
                </View>
                <View style={styles.nutrientBox}>
                  <Text>{(item.carbs * factor).toFixed(1)}g Carbs</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 5, borderColor: "#000" },
  searchButton: { backgroundColor: "#F6E1D3", padding: 10, borderRadius: 5, alignItems: "center" },
  searchButtonText: { color: "#E06714", fontWeight: "bold" },
  error: { color: "red", textAlign: "center", marginTop: 10 },
  foodContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", marginVertical: 5 },
  foodName: { fontSize: 18, fontWeight: "bold" },
  calories: { fontSize: 16, color: "#555" },
  nutrientRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  nutrientBox: { padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", marginHorizontal: 5 },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  quantityButton: { padding: 10, borderWidth: 1, borderRadius: 5, marginHorizontal: 5 },
  quantityInput: { borderWidth: 1, padding: 10, borderRadius: 5, textAlign: "center", width: 60 },
  pickerContainer: { borderWidth: 1, borderColor: "#000", borderRadius: 5, width: 100, backgroundColor: "#fff" },
  unitPicker: { color: "#000" },
});

export default FoodSearchScreen;
