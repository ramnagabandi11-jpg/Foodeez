import SwiftUI

struct CartView: View {
    @State private var cartItems: [CartItem] = sampleCartItems
    @State private var promoCode = ""
    @State private var isApplyingPromo = false

    private var subtotal: Double {
        cartItems.reduce(0) { total, item in
            total + (item.price * Double(item.quantity))
        }
    }

    private var deliveryFee: Double {
        subtotal > 0 ? 40.0 : 0.0
    }

    private var platformFee: Double {
        subtotal > 0 ? 5.0 : 0.0
    }

    private var discount: Double {
        subtotal > 0 ? 50.0 : 0.0 // Sample discount
    }

    private var total: Double {
        subtotal + deliveryFee + platformFee - discount
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if cartItems.isEmpty {
                    // Empty Cart
                    VStack(spacing: 20) {
                        Spacer()

                        Image(systemName: "cart")
                            .font(.system(size: 80))
                            .foregroundColor(.gray)

                        Text("Your cart is empty")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)

                        Text("Add items from your favorite restaurants")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Browse Restaurants") {
                            // Navigate to search
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.orange)

                        Spacer()
                    }
                    .padding()
                } else {
                    // Cart Items
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            // Restaurant Section
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Paradise Biryani")
                                    .font(.headline)
                                    .fontWeight(.medium)

                                ForEach(cartItems) { item in
                                    CartItemRow(item: item) { quantity in
                                        updateQuantity(for: item, to: quantity)
                                    } onRemove: {
                                        removeFromCart(item)
                                    }
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)

                            // Promo Code
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Apply Promo Code")
                                    .font(.headline)
                                    .fontWeight(.medium)

                                HStack {
                                    TextField("Enter promo code", text: $promoCode)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())

                                    Button("Apply") {
                                        applyPromoCode()
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(.orange)
                                    .disabled(promoCode.isEmpty || isApplyingPromo)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)

                            // Bill Details
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Bill Details")
                                    .font(.headline)
                                    .fontWeight(.medium)

                                VStack(spacing: 8) {
                                    BillRow(title: "Item Total", value: "₹\(String(format: "%.0f", subtotal))")
                                    BillRow(title: "Delivery Fee", value: "₹\(String(format: "%.0f", deliveryFee))")
                                    BillRow(title: "Platform Fee", value: "₹\(String(format: "%.0f", platformFee))")

                                    if discount > 0 {
                                        BillRow(
                                            title: "Promo Discount",
                                            value: "-₹\(String(format: "%.0f", discount))",
                                            valueColor: .green
                                        )
                                    }

                                    Divider()

                                    BillRow(
                                        title: "Total",
                                        value: "₹\(String(format: "%.0f", total))",
                                        font: .headline,
                                        weight: .bold
                                    )
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Cart")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if !cartItems.isEmpty {
                        Button("Clear") {
                            clearCart()
                        }
                        .foregroundColor(.red)
                    }
                }
            }
            .overlay(
                // Checkout Button
                Group {
                    if !cartItems.isEmpty {
                        VStack {
                            Spacer()

                            Button(action: {
                                // Proceed to checkout
                            }) {
                                HStack {
                                    Text("Proceed to Checkout")
                                        .font(.headline)
                                        .fontWeight(.medium)

                                    Spacer()

                                    Text("₹\(String(format: "%.0f", total))")
                                        .font(.headline)
                                        .fontWeight(.bold)
                                }
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.orange)
                                .cornerRadius(12)
                                .padding(.horizontal)
                            }
                            .padding(.bottom, 8)
                        }
                    }
                }
                , alignment: .bottom
            )
        }
    }

    private func updateQuantity(for item: CartItem, to quantity: Int) {
        if let index = cartItems.firstIndex(where: { $0.id == item.id }) {
            if quantity <= 0 {
                cartItems.remove(at: index)
            } else {
                cartItems[index].quantity = quantity
            }
        }
    }

    private func removeFromCart(_ item: CartItem) {
        cartItems.removeAll { $0.id == item.id }
    }

    private func clearCart() {
        cartItems.removeAll()
    }

    private func applyPromoCode() {
        isApplyingPromo = true
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isApplyingPromo = false
            promoCode = ""
            // Show success message
        }
    }
}

struct CartItemRow: View {
    let item: CartItem
    let onQuantityChange: (Int) -> Void
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Item Image
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.3))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: "fork.knife")
                        .foregroundColor(.gray)
                )

            // Item Details
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(item.customization ?? "")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("₹\(String(format: "%.0f", item.price))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.orange)
            }

            Spacer()

            // Quantity Controls
            HStack(spacing: 8) {
                Button(action: {
                    onQuantityChange(item.quantity - 1)
                }) {
                    Image(systemName: "minus")
                        .font(.caption)
                        .foregroundColor(.orange)
                        .frame(width: 24, height: 24)
                        .background(Color.orange.opacity(0.1))
                        .clipShape(Circle())
                }

                Text("\(item.quantity)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .frame(minWidth: 20)

                Button(action: {
                    onQuantityChange(item.quantity + 1)
                }) {
                    Image(systemName: "plus")
                        .font(.caption)
                        .foregroundColor(.orange)
                        .frame(width: 24, height: 24)
                        .background(Color.orange.opacity(0.1))
                        .clipShape(Circle())
                }
            }
        }
    }
}

struct BillRow: View {
    let title: String
    let value: String
    let font: Font
    let weight: Font.Weight
    let valueColor: Color

    init(
        title: String,
        value: String,
        font: Font = .body,
        weight: Font.Weight = .regular,
        valueColor: Color = .primary
    ) {
        self.title = title
        self.value = value
        self.font = font
        self.weight = weight
        self.valueColor = valueColor
    }

    var body: some View {
        HStack {
            Text(title)
                .font(font)
                .fontWeight(weight)

            Spacer()

            Text(value)
                .font(font)
                .fontWeight(weight)
                .foregroundColor(valueColor)
        }
    }
}

// Models
struct CartItem {
    let id = UUID()
    let name: String
    let price: Double
    var quantity: Int
    let customization: String?
}

// Sample Data
let sampleCartItems: [CartItem] = [
    CartItem(name: "Chicken Biryani", price: 280, quantity: 1, customization: "With Extra Raita"),
    CartItem(name: "Mutton Biryani", price: 320, quantity: 2, customization: "Regular"),
    CartItem(name: "Veg Fried Rice", price: 180, quantity: 1, customization: "No Extra Spice"),
]

#Preview {
    CartView()
}