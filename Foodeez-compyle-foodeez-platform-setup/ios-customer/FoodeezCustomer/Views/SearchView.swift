import SwiftUI

struct SearchView: View {
    @State private var searchText = ""
    @State private var selectedCategory: String? = nil
    @State private var selectedSortOption = "Relevance"

    private let sortOptions = ["Relevance", "Rating", "Delivery Time", "Cost: Low to High", "Cost: High to Low"]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)

                    TextField("Search for dishes or restaurants", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())

                    if !searchText.isEmpty {
                        Button(action: {
                            searchText = ""
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding(.horizontal)
                .padding(.top, 8)

                // Filter Options
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        // Sort Button
                        Menu {
                            ForEach(sortOptions, id: \.self) { option in
                                Button(action: {
                                    selectedSortOption = option
                                }) {
                                    HStack {
                                        Text(option)
                                        if selectedSortOption == option {
                                            Image(systemName: "checkmark")
                                        }
                                    }
                                }
                            }
                        } label: {
                            HStack {
                                Image(systemName: "arrow.up.arrow.down")
                                    .font(.caption)
                                Text(selectedSortOption)
                                    .font(.caption)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.orange.opacity(0.1))
                            .foregroundColor(.orange)
                            .cornerRadius(20)
                        }

                        // Category Filters
                        ForEach(searchCategories, id: \.self) { category in
                            Button(action: {
                                selectedCategory = selectedCategory == category ? nil : category
                            }) {
                                Text(category)
                                    .font(.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(selectedCategory == category ? Color.orange : Color(.systemGray6))
                                    .foregroundColor(selectedCategory == category ? .white : .primary)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)

                // Search Results
                if searchText.isEmpty {
                    // Recent Searches
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Recent Searches")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 12) {
                            ForEach(recentSearches, id: \.self) { search in
                                HStack {
                                    Image(systemName: "clock")
                                        .foregroundColor(.gray)
                                        .frame(width: 20)

                                    Text(search)
                                        .foregroundColor(.primary)

                                    Spacer()

                                    Button(action: {
                                        // Remove from recent
                                    }) {
                                        Image(systemName: "xmark")
                                            .foregroundColor(.gray)
                                            .font(.caption)
                                    }
                                }
                                .padding(.horizontal)
                                .padding(.vertical, 8)
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                                .padding(.horizontal)
                            }
                        }
                    }
                    .padding(.top, 20)

                    Spacer()
                } else {
                    // Search Results
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(searchResults, id: \.id) { result in
                                SearchResultRow(result: result)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 16)
                    }
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct SearchResultRow: View {
    let result: SearchResult

    var body: some View {
        HStack(spacing: 12) {
            // Restaurant/Image
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.3))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: result.type == "restaurant" ? "store.fill" : "fork.knife")
                        .foregroundColor(.gray)
                )

            // Details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(result.name)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Spacer()

                    if result.type == "restaurant" {
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                            Text(String(format: "%.1f", result.rating ?? 0))
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                }

                if result.type == "restaurant" {
                    Text(result.cuisine ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HStack {
                        Text("\(result.deliveryTime ?? 0) min")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("•")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("₹\(result.minOrder ?? 0) min order")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("Dish")
                        .font(.caption)
                        .foregroundColor(.orange)

                    Text("Available in multiple restaurants")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

// Models
struct SearchResult {
    let id = UUID()
    let name: String
    let type: String // "restaurant" or "dish"
    let cuisine: String?
    let rating: Double?
    let deliveryTime: Int?
    let minOrder: Int?
}

// Sample Data
let searchCategories = ["Pure Veg", "Fast Delivery", "Rating 4.0+", "Offers", "New Arrivals"]

let recentSearches = [
    "Biryani",
    "Pizza near me",
    "Chinese food",
    "Burgers",
]

let searchResults = [
    SearchResult(name: "Paradise Biryani", type: "restaurant", cuisine: "Hyderabadi, Biryani", rating: 4.5, deliveryTime: 35, minOrder: 200),
    SearchResult(name: "Chicken Biryani", type: "dish", cuisine: nil, rating: nil, deliveryTime: nil, minOrder: nil),
    SearchResult(name: "Meghana Foods", type: "restaurant", cuisine: "Andhra, Biryani", rating: 4.4, deliveryTime: 40, minOrder: 300),
    SearchResult(name: "Mutton Biryani", type: "dish", cuisine: nil, rating: nil, deliveryTime: nil, minOrder: nil),
]

#Preview {
    SearchView()
}