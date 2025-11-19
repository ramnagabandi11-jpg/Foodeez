package com.foodeez.customer.ui.screens.profile

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
import com.foodeez.customer.ui.screens.profile.viewmodel.ProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    navController: NavController,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Header
            item {
                ProfileHeader(
                    userName = uiState.userName,
                    phoneNumber = uiState.phoneNumber,
                    email = uiState.email
                )
            }

            // Rewards Section
            item {
                RewardsCard(rewardsPoints = uiState.rewardsPoints)
            }

            // Menu Sections
            item {
                ProfileMenuSection(
                    title = "Account",
                    menuItems = ProfileMenuItem.getAccountMenuItems(),
                    onMenuItemClick = { /* Handle menu clicks */ }
                )
            }

            item {
                ProfileMenuSection(
                    title = "Support",
                    menuItems = ProfileMenuItem.getSupportMenuItems(),
                    onMenuItemClick = { /* Handle menu clicks */ }
                )
            }

            item {
                ProfileMenuSection(
                    title = "App",
                    menuItems = ProfileMenuItem.getAppMenuItems(),
                    onMenuItemClick = { /* Handle menu clicks */ }
                )
            }

            // Logout Button
            item {
                OutlinedButton(
                    onClick = { showLogoutDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Logout,
                        contentDescription = "Logout",
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Logout")
                }
            }

            // App Version
            item {
                Text(
                    text = "Foodeez Customer v1.0.0",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }

    // Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text = { Text("Are you sure you want to logout?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.logout()
                        showLogoutDialog = false
                        // Navigate to login screen
                    }
                ) {
                    Text("Logout", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ProfileHeader(
    userName: String,
    phoneNumber: String,
    email: String
) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Avatar
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = androidx.compose.foundation.shape.CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = userName.take(2).uppercase(),
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }

            // User Info
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = userName,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = phoneNumber,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Edit Profile Button
            OutlinedButton(
                onClick = { /* Navigate to edit profile */ }
            ) {
                Text("Edit Profile")
            }
        }
    }
}

@Composable
fun RewardsCard(
    rewardsPoints: Int
) {
    Card {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Rewards",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Foodeez Rewards",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = "$rewardsPoints points",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Redeem points for exciting offers!",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun ProfileMenuSection(
    title: String,
    menuItems: List<ProfileMenuItem>,
    onMenuItemClick: (ProfileMenuItem) -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Card {
            Column {
                menuItems.forEachIndexed { index, item ->
                    ProfileMenuItemRow(
                        item = item,
                        onClick = { onMenuItemClick(item) }
                    )
                    if (index < menuItems.size - 1) {
                        Divider(
                            modifier = Modifier.padding(start = 56.dp),
                            color = MaterialTheme.colorScheme.outlineVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileMenuItemRow(
    item: ProfileMenuItem,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = item.icon,
            contentDescription = item.title,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )

        Spacer(modifier = Modifier.width(16.dp))

        Text(
            text = item.title,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f)
        )

        if (item.badge != null) {
            Badge {
                Text(item.badge)
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = "Navigate",
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp)
        )
    }
}

data class ProfileMenuItem(
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val badge: String? = null,
    val route: String? = null
) {
    companion object {
        fun getAccountMenuItems(): List<ProfileMenuItem> {
            return listOf(
                ProfileMenuItem(
                    title = "Delivery Addresses",
                    icon = Icons.Default.LocationOn
                ),
                ProfileMenuItem(
                    title = "Payment Methods",
                    icon = Icons.Default.Payment
                ),
                ProfileMenuItem(
                    title = "Notifications",
                    icon = Icons.Default.Notifications,
                    badge = "3"
                ),
                ProfileMenuItem(
                    title = "Favorites",
                    icon = Icons.Default.Favorite
                ),
                ProfileMenuItem(
                    title = "Order History",
                    icon = Icons.Default.History
                )
            )
        }

        fun getSupportMenuItems(): List<ProfileMenuItem> {
            return listOf(
                ProfileMenuItem(
                    title = "Help Center",
                    icon = Icons.Default.Help
                ),
                ProfileMenuItem(
                    title = "Contact Us",
                    icon = Icons.Default.ContactSupport
                ),
                ProfileMenuItem(
                    title = "Terms & Conditions",
                    icon = Icons.Default.Description
                ),
                ProfileMenuItem(
                    title = "Privacy Policy",
                    icon = Icons.Default.Security
                )
            )
        }

        fun getAppMenuItems(): List<ProfileMenuItem> {
            return listOf(
                ProfileMenuItem(
                    title = "Rate Us",
                    icon = Icons.Default.Star
                ),
                ProfileMenuItem(
                    title = "Share App",
                    icon = Icons.Default.Share
                ),
                ProfileMenuItem(
                    title = "About",
                    icon = Icons.Default.Info
                )
            )
        }
    }
}