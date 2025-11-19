package com.foodeez.customer.ui.screens.cart

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.foodeez.customer.domain.model.CartItem
import com.foodeez.customer.ui.screens.cart.viewmodel.CartViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    navController: NavController,
    viewModel: CartViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cart") },
                actions = {
                    if (uiState.cartItems.isNotEmpty()) {
                        TextButton(onClick = viewModel::clearCart) {
                            Text("Clear", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            )
        },
        bottomBar = {
            if (uiState.cartItems.isNotEmpty()) {
                CartCheckoutBar(
                    subtotal = uiState.subtotal,
                    deliveryFee = uiState.deliveryFee,
                    total = uiState.total,
                    onCheckout = { navController.navigate("checkout") }
                )
            }
        }
    ) { paddingValues ->
        if (uiState.cartItems.isEmpty()) {
            EmptyCartContent(modifier = Modifier.padding(paddingValues))
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Restaurant Section
                item {
                    Card {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Paradise Biryani",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Delivery in 35-40 min",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // Cart Items
                items(uiState.cartItems) { cartItem ->
                    CartItemCard(
                        cartItem = cartItem,
                        onQuantityChange = viewModel::updateItemQuantity,
                        onRemove = viewModel::removeFromCart
                    )
                }

                // Promo Code Section
                item {
                    PromoCodeSection(
                        promoCode = uiState.promoCode,
                        onPromoCodeChange = viewModel::updatePromoCode,
                        onApplyPromo = viewModel::applyPromoCode
                    )
                }

                // Bill Details
                item {
                    BillDetailsCard(
                        subtotal = uiState.subtotal,
                        deliveryFee = uiState.deliveryFee,
                        platformFee = uiState.platformFee,
                        discount = uiState.discount,
                        total = uiState.total
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyCartContent(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ShoppingCart,
                contentDescription = "Empty Cart",
                modifier = Modifier.size(80.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Text(
                text = "Your cart is empty",
                style = MaterialTheme.typography.headlineSmall
            )
            Text(
                text = "Add items from your favorite restaurants",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Button(
                onClick = { /* Navigate to restaurants */ }
            ) {
                Text("Browse Restaurants")
            }
        }
    }
}

@Composable
fun CartItemCard(
    cartItem: CartItem,
    onQuantityChange: (String, Int) -> Unit,
    onRemove: (String) -> Unit
) {
    Card {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Item Image
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = MaterialTheme.shapes.medium
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Restaurant,
                    contentDescription = cartItem.name,
                    modifier = Modifier.size(30.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = cartItem.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )

                cartItem.customization?.let { customization ->
                    Text(
                        text = customization,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Text(
                    text = "₹${cartItem.price}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            // Quantity Controls
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(
                    onClick = { onQuantityChange(cartItem.id, cartItem.quantity - 1) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Remove,
                        contentDescription = "Decrease quantity"
                    )
                }

                Text(
                    text = cartItem.quantity.toString(),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.widthIn(minWidth = 24.dp)
                )

                IconButton(
                    onClick = { onQuantityChange(cartItem.id, cartItem.quantity + 1) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Increase quantity"
                    )
                }

                IconButton(
                    onClick = { onRemove(cartItem.id) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Remove item",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun CartCheckoutBar(
    subtotal: Double,
    deliveryFee: Double,
    total: Double,
    onCheckout: () -> Unit
) {
    Surface(
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Button(
                onClick = onCheckout,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Proceed to Checkout",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "₹$total",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun PromoCodeSection(
    promoCode: String,
    onPromoCodeChange: (String) -> Unit,
    onApplyPromo: () -> Unit
) {
    Card {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Apply Promo Code",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = promoCode,
                    onValueChange = onPromoCodeChange,
                    placeholder = { Text("Enter promo code") },
                    modifier = Modifier.weight(1f)
                )
                Button(
                    onClick = onApplyPromo,
                    enabled = promoCode.isNotBlank()
                ) {
                    Text("Apply")
                }
            }
        }
    }
}

@Composable
fun BillDetailsCard(
    subtotal: Double,
    deliveryFee: Double,
    platformFee: Double,
    discount: Double,
    total: Double
) {
    Card {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Bill Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(12.dp))

            BillRow(title = "Item Total", value = "₹$subtotal")
            BillRow(title = "Delivery Fee", value = "₹$deliveryFee")
            BillRow(title = "Platform Fee", value = "₹$platformFee")

            if (discount > 0) {
                BillRow(
                    title = "Promo Discount",
                    value = "-₹$discount",
                    valueColor = MaterialTheme.colorScheme.primary
                )
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            BillRow(
                title = "Total",
                value = "₹$total",
                fontWeight = FontWeight.Bold,
                valueStyle = MaterialTheme.typography.titleMedium
            )
        }
    }
}

@Composable
fun BillRow(
    title: String,
    value: String,
    fontWeight: FontWeight = FontWeight.Normal,
    valueStyle: androidx.compose.ui.text.TextStyle = MaterialTheme.typography.bodyMedium,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = fontWeight
        )
        Text(
            text = value,
            style = valueStyle,
            fontWeight = fontWeight,
            color = valueColor
        )
    }
}