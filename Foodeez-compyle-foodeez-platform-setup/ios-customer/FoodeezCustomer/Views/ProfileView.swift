import SwiftUI

struct ProfileView: View {
    @State private var notificationsEnabled = true
    @State private var showingLogoutAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    VStack(spacing: 16) {
                        // Profile Image
                        Circle()
                            .fill(Color.orange.opacity(0.1))
                            .frame(width: 100, height: 100)
                            .overlay(
                                Text("JD")
                                    .font(.largeTitle)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                            )

                        VStack(spacing: 4) {
                            Text("John Doe")
                                .font(.title2)
                                .fontWeight(.bold)

                            Text("+91 98765 43210")
                                .font(.subheadline)
                                .foregroundColor(.secondary)

                            Text("john.doe@example.com")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Button("Edit Profile") {
                            // Edit profile
                        }
                        .font(.subheadline)
                        .foregroundColor(.orange)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(20)
                    }
                    .padding()

                    // Rewards Section
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)

                            Text("Foodeez Rewards")
                                .font(.headline)
                                .fontWeight(.semibold)

                            Spacer()

                            Text("850 points")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.orange)
                        }

                        HStack {
                            Text("Redeem points for exciting offers!")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Spacer()
                        }

                        Button("View Rewards") {
                            // View rewards
                        }
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.orange)
                        .cornerRadius(8)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Menu Sections
                    VStack(spacing: 20) {
                        // Account Section
                        MenuSection(title: "Account", items: [
                            MenuItem(icon: "location.fill", title: "Delivery Addresses", badge: nil),
                            MenuItem(icon: "creditcard.fill", title: "Payment Methods", badge: nil),
                            MenuItem(icon: "bell.fill", title: "Notifications", badge: nil, isToggle: true, toggleValue: $notificationsEnabled),
                            MenuItem(icon: "heart.fill", title: "Favorites", badge: nil),
                            MenuItem(icon: "clock.fill", title: "Order History", badge: nil),
                        ])

                        // Support Section
                        MenuSection(title: "Support", items: [
                            MenuItem(icon: "questionmark.circle.fill", title: "Help Center", badge: nil),
                            MenuItem(icon: "message.fill", title: "Contact Us", badge: nil),
                            MenuItem(icon: "doc.text.fill", title: "Terms & Conditions", badge: nil),
                            MenuItem(icon: "shield.fill", title: "Privacy Policy", badge: nil),
                        ])

                        // App Section
                        MenuSection(title: "App", items: [
                            MenuItem(icon: "star.fill", title: "Rate Us", badge: nil),
                            MenuItem(icon: "square.and.arrow.up.fill", title: "Share App", badge: nil),
                            MenuItem(icon: "info.circle.fill", title: "About", badge: nil),
                        ])
                    }

                    // Logout Button
                    Button(action: {
                        showingLogoutAlert = true
                    }) {
                        HStack {
                            Image(systemName: "arrow.left.square.fill")
                                .foregroundColor(.red)

                            Text("Logout")
                                .font(.headline)
                                .fontWeight(.medium)
                                .foregroundColor(.red)

                            Spacer()
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .padding(.bottom)

                    // App Version
                    Text("Foodeez Customer v1.0.0")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.bottom)
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .alert("Logout", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Logout", role: .destructive) {
                    // Handle logout
                }
            } message: {
                Text("Are you sure you want to logout?")
            }
        }
    }
}

struct MenuSection: View {
    let title: String
    let items: [MenuItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.horizontal)

            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    MenuItemRow(item: item)

                    if index < items.count - 1 {
                        Divider()
                            .padding(.leading, 44)
                    }
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
            .padding(.horizontal)
        }
    }
}

struct MenuItemRow: View {
    let item: MenuItem
    @State private var showingToggle = false

    var body: some View {
        HStack {
            Image(systemName: item.iconName)
                .foregroundColor(.orange)
                .frame(width: 20)

            Text(item.title)
                .font(.subheadline)
                .foregroundColor(.primary)

            Spacer()

            HStack(spacing: 8) {
                if let badge = item.badge {
                    Text(badge)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red)
                        .cornerRadius(10)
                }

                if item.isToggle {
                    Toggle("", isOn: item.toggleValue ?? $showingToggle)
                        .tint(.orange)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .contentShape(Rectangle())
        .onTapGesture {
            if !item.isToggle {
                // Handle navigation
            }
        }
    }
}

struct MenuItem {
    let id = UUID()
    let iconName: String
    let title: String
    let badge: String?
    let isToggle: Bool
    let toggleValue: Binding<Bool>?

    init(icon: String, title: String, badge: String? = nil, isToggle: Bool = false, toggleValue: Binding<Bool>? = nil) {
        self.iconName = icon
        self.title = title
        self.badge = badge
        self.isToggle = isToggle
        self.toggleValue = toggleValue
    }
}

#Preview {
    ProfileView()
}