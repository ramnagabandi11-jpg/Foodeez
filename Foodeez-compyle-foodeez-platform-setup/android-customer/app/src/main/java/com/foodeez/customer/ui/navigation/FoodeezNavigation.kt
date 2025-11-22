package com.foodeez.customer.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.foodeez.customer.ui.screens.BottomNavigationWithSwipe
import com.foodeez.customer.ui.screens.auth.LoginScreen
import com.foodeez.customer.ui.screens.auth.SignupScreen
import com.foodeez.customer.ui.screens.auth.SplashScreen

@Composable
fun FoodeezNavigation(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(navController = navController)
        }

        composable(Screen.Login.route) {
            LoginScreen(navController = navController)
        }

        composable(Screen.Signup.route) {
            SignupScreen(navController = navController)
        }

        composable(Screen.Main.route) {
            BottomNavigationWithSwipe()
        }

        composable(Screen.RestaurantDetails.route) { backStackEntry ->
            val restaurantId = backStackEntry.arguments?.getString("restaurantId")
            // RestaurantDetailsScreen(navController = navController, restaurantId = restaurantId)
        }

        composable(Screen.Cart.route) {
            // CartScreen(navController = navController)
        }

        composable(Screen.Checkout.route) {
            // CheckoutScreen(navController = navController)
        }

        composable(Screen.OrderTracking.route) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId")
            // OrderTrackingScreen(navController = navController, orderId = orderId)
        }

        composable(Screen.Profile.route) {
            // ProfileScreen(navController = navController)
        }
    }
}

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Signup : Screen("signup")
    object Main : Screen("main")
    object Home : Screen("home")
    object Search : Screen("search")
    object Orders : Screen("orders")
    object Cart : Screen("cart")
    object Profile : Screen("profile")
    object RestaurantDetails : Screen("restaurant_details/{restaurantId}") {
        fun passRestaurantId(restaurantId: String): String {
            return "restaurant_details/$restaurantId"
        }
    }
    object Checkout : Screen("checkout")
    object OrderTracking : Screen("order_tracking/{orderId}") {
        fun passOrderId(orderId: String): String {
            return "order_tracking/$orderId"
        }
    }
}