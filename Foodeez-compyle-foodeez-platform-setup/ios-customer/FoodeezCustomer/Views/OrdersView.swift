import SwiftUI

struct OrdersView: View {
    @State private var selectedFilter = "All Orders"

    private let orderFilters = ["All Orders", "Active", "Completed", "Cancelled"]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Filter Tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(orderFilters, id: \.self) { filter in
                            Button(action: {
                                selectedFilter = filter
                            }) {
                                Text(filter)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedFilter == filter ? Color.orange : Color.clear)
                                    .foregroundColor(selectedFilter == filter ? .white : .orange)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(Color.orange, lineWidth: selectedFilter == filter ? 0 : 1)
                                    )
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)

                // Orders List
                if filteredOrders.isEmpty {
                    VStack(spacing: 20) {
                        Spacer()

                        Image(systemName: "bag")
                            .font(.system(size: 80))
                            .foregroundColor(.gray)

                        Text("No \(selectedFilter.lowercased())")
                            .font(.title2)
                            .fontWeight(.semibold)

                        if selectedFilter == "All Orders" {
                            Text("Your order history will appear here")
                                .font(.body)
                                .foregroundColor(.secondary)

                            Button("Order Food Now") {
                                // Navigate to home
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.orange)
                        }

                        Spacer()
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredOrders) { order in
                                OrderCard(order: order)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("My Orders")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    private var filteredOrders: [Order] {
        if selectedFilter == "All Orders" {
            return sampleOrders
        } else if selectedFilter == "Active" {
            return sampleOrders.filter { $0.status == .preparing || $0.status == .onTheWay }
        } else if selectedFilter == "Completed" {
            return sampleOrders.filter { $0.status == .delivered }
        } else if selectedFilter == "Cancelled" {
            return sampleOrders.filter { $0.status == .cancelled }
        }
        return sampleOrders
    }
}

struct OrderCard: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(order.restaurantName)
                        .font(.headline)
                        .fontWeight(.medium)

                    Text(order.items.map { $0.name + ( $0.quantity > 1 ? " x\($0.quantity)" : "") }.joined(separator: ", "))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("₹\(String(format: "%.0f", order.total))")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)

                    Text(order.formattedDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Status and Actions
            HStack {
                // Status
                HStack(spacing: 6) {
                    Image(systemName: order.statusIcon)
                        .foregroundColor(order.statusColor)
                        .font(.caption)

                    Text(order.statusText)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(order.statusColor)
                }

                Spacer()

                // Action Button
                if order.status == .delivered {
                    Button("Reorder") {
                        // Reorder items
                    }
                    .font(.caption)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(16)
                } else if order.status == .onTheWay {
                    Button("Track Order") {
                        // Track order
                    }
                    .font(.caption)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(16)
                }
            }

            // Progress Bar (for active orders)
            if order.status == .preparing || order.status == .onTheWay {
                VStack(alignment: .leading, spacing: 8) {
                    ProgressView(value: order.progress, total: 1.0)
                        .tint(.orange)

                    HStack {
                        ForEach(OrderStatusProgress.allCases, id: \.self) { stage in
                            Circle()
                                .fill(stage.rawValue <= order.currentStage ? Color.orange : Color.gray.opacity(0.3))
                                .frame(width: 8, height: 8)

                            if stage != OrderStatusProgress.allCases.last {
                                Spacer()
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

// Models
enum OrderStatus: String, CaseIterable {
    case placed = "Order Placed"
    case confirmed = "Order Confirmed"
    case preparing = "Preparing"
    case onTheWay = "On the way"
    case delivered = "Delivered"
    case cancelled = "Cancelled"

    var statusText: String {
        return self.rawValue
    }

    var statusIcon: String {
        switch self {
        case .placed, .confirmed:
            return "clock.fill"
        case .preparing:
            return "bowl.fill"
        case .onTheWay:
            return "bicycle"
        case .delivered:
            return "checkmark.circle.fill"
        case .cancelled:
            return "xmark.circle.fill"
        }
    }

    var statusColor: Color {
        switch self {
        case .placed, .confirmed:
            return .blue
        case .preparing:
            return .orange
        case .onTheWay:
            return .purple
        case .delivered:
            return .green
        case .cancelled:
            return .red
        }
    }

    var progressValue: Double {
        switch self {
        case .placed:
            return 0.2
        case .confirmed:
            return 0.4
        case .preparing:
            return 0.6
        case .onTheWay:
            return 0.8
        case .delivered:
            return 1.0
        case .cancelled:
            return 0.0
        }
    }

    var stage: OrderStatusProgress {
        switch self {
        case .placed:
            return .orderPlaced
        case .confirmed:
            return .orderConfirmed
        case .preparing:
            return .preparing
        case .onTheWay:
            return .onTheWay
        case .delivered:
            return .delivered
        case .cancelled:
            return .orderPlaced
        }
    }
}

enum OrderStatusProgress: String, CaseIterable {
    case orderPlaced = "Order Placed"
    case orderConfirmed = "Confirmed"
    case preparing = "Preparing"
    case onTheWay = "On the way"
    case delivered = "Delivered"
}

struct Order {
    let id = UUID()
    let restaurantName: String
    let items: [OrderItem]
    let total: Double
    let status: OrderStatus
    let orderDate: Date

    var progress: Double {
        status.progressValue
    }

    var currentStage: OrderStatusProgress.RawValue {
        OrderStatusProgress.allCases.firstIndex(of: status.stage) ?? 0
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, h:mm a"
        return formatter.string(from: orderDate)
    }
}

struct OrderItem {
    let name: String
    let quantity: Int
    let price: Double
}

// Sample Data
let sampleOrders: [Order] = [
    Order(
        restaurantName: "Paradise Biryani",
        items: [
            OrderItem(name: "Chicken Biryani", quantity: 2, price: 280),
            OrderItem(name: "Mutton Biryani", quantity: 1, price: 320)
        ],
        total: 880,
        status: .delivered,
        orderDate: Date().addingTimeInterval(-86400) // 1 day ago
    ),
    Order(
        restaurantName: "Meghana Foods",
        items: [
            OrderItem(name: "Veg Fried Rice", quantity: 1, price: 180),
            OrderItem(name: "Paneer Tikka", quantity: 2, price: 250)
        ],
        total: 680,
        status: .onTheWay,
        orderDate: Date().addingTimeInterval(-3600) // 1 hour ago
    ),
    Order(
        restaurantName: "Dominos Pizza",
        items: [
            OrderItem(name: "Margherita Pizza", quantity: 1, price: 350),
            OrderItem(name: "Garlic Bread", quantity: 1, price: 120)
        ],
        total: 470,
        status: .preparing,
        orderDate: Date().addingTimeInterval(-1800) // 30 mins ago
    ),
    Order(
        restaurantName: "KFC",
        items: [
            OrderItem(name: "Chicken Bucket", quantity: 1, price: 450)
        ],
        total: 450,
        status: .cancelled,
        orderDate: Date().addingTimeInterval(-172800) // 2 days ago
    ),
]

#Preview {
    OrdersView()
}