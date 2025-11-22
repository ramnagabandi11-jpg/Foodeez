import SwiftUI

struct HomeView: View {
    @State private var searchText = ""
    @State private var selectedLocation = "Current Location"

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Delivering to")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(selectedLocation)
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }

                        Spacer()

                        Button(action: {
                            // Change location
                        }) {
                            Image(systemName: "location.fill")
                                .foregroundColor(.orange)
                        }
                    }
                    .padding(.horizontal)

                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)

                        TextField("Search for dishes or restaurants", text: $searchText)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal)

                    // Promotional Banner
                    Image(systemName: "tag.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(height: 150)
                        .background(LinearGradient(gradient: Gradient(colors: [.orange, .red]), startPoint: .topLeading, endPoint: .bottomTrailing))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.horizontal)
                        .overlay(
                            VStack {
                                Text("50% OFF")
                                    .font(.largeTitle)
                                    .fontWeight(.bold)
                                Text("On your first order")
                                    .font(.headline)
                            }
                            .foregroundColor(.white)
                        )

                    // Categories
                    VStack(alignment: .leading) {
                        Text("Categories")
                            .font(.title2)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 15) {
                                ForEach(categories, id: \.id) { category in
                                    CategoryCard(category: category)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Popular Restaurants
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Popular Restaurants")
                                .font(.title2)
                                .fontWeight(.bold)

                            Spacer()

                            Button("See all") {
                                // Navigate to all restaurants
                            }
                            .foregroundColor(.orange)
                        }
                        .padding(.horizontal)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 15) {
                            ForEach(popularRestaurants, id: \.id) { restaurant in
                                RestaurantCard(restaurant: restaurant)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .navigationTitle("Foodeez")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        // Notifications
                    }) {
                        Image(systemName: "bell")
                            .foregroundColor(.orange)
                    }
                }
            }
        }
    }
}

struct CategoryCard: View {
    let category: FoodCategory

    var body: some View {
        VStack {
            Image(systemName: category.iconName)
                .font(.title2)
                .foregroundColor(.white)
                .frame(width: 60, height: 60)
                .background(category.color)
                .clipShape(Circle())

            Text(category.name)
                .font(.caption)
                .foregroundColor(.primary)
        }
        .frame(width: 80)
    }
}

struct RestaurantCard: View {
    let restaurant: Restaurant

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Restaurant Image
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.3))
                .aspectRatio(16/9, contentMode: .fit)
                .overlay(
                    Image(systemName: "photo.fill")
                        .foregroundColor(.gray)
                        .font(.title)
                )

            // Restaurant Info
            VStack(alignment: .leading, spacing: 4) {
                Text(restaurant.name)
                    .font(.headline)
                    .fontWeight(.medium)

                HStack {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                        .font(.caption)

                    Text(String(format: "%.1f", restaurant.rating))
                        .font(.caption)
                        .fontWeight(.medium)

                    Text("(\(restaurant.reviewCount))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text("\(restaurant.deliveryTime) min")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(restaurant.cuisine)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

// Models
struct FoodCategory {
    let id = UUID()
    let name: String
    let iconName: String
    let color: Color
}

struct Restaurant {
    let id = UUID()
    let name: String
    let cuisine: String
    let rating: Double
    let reviewCount: Int
    let deliveryTime: Int
}

// Sample Data
let categories = [
    FoodCategory(name: "Biryani", iconName: "bowl.fill", color: .orange),
    FoodCategory(name: "Pizza", iconName: "circle.fill", color: .red),
    FoodCategory(name: "Burger", iconName: "square.fill", color: .yellow),
    FoodCategory(name: "Chinese", iconName: "triangularprism.fill", color: .green),
    FoodCategory(name: "Desserts", iconName: "heart.fill", color: .pink),
    FoodCategory(name: "Drinks", iconName: "drop.fill", color: .blue),
]

let popularRestaurants = [
    Restaurant(name: "Paradise Biryani", cuisine: "Hyderabadi, Biryani", rating: 4.5, reviewCount: 2341, deliveryTime: 35),
    Restaurant(name: "Dominos Pizza", cuisine: "Pizza, Fast Food", rating: 4.3, reviewCount: 1876, deliveryTime: 40),
    Restaurant(name: "Meghana Foods", cuisine: "Andhra, Biryani", rating: 4.4, reviewCount: 1598, deliveryTime: 45),
    Restaurant(name: "KFC", cuisine: "Burger, Fast Food", rating: 4.2, reviewCount: 987, deliveryTime: 30),
]

#Preview {
    HomeView()
}