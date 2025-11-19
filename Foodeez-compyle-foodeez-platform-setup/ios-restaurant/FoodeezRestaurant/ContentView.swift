import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "square.fill.text.grid.1x2")
                    Text("Dashboard")
                }
                .tag(0)

            OrdersView()
                .tabItem {
                    Image(systemName: "bag.fill")
                    Text("Orders")
                }
                .tag(1)

            MenuView()
                .tabItem {
                    Image(systemName: "fork.knife")
                    Text("Menu")
                }
                .tag(2)

            AnalyticsView()
                .tabItem {
                    Image(systemName: "chart.bar.fill")
                    Text("Analytics")
                }
                .tag(3)

            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
                .tag(4)
        }
        .accentColor(.green)
    }
}

#Preview {
    ContentView()
}