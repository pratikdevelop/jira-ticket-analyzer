"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Paper,
  ClickAwayListener,
  Fade,
  Popper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  CreateNewFolder as CreateNewFolderIcon,
  BugReport as BugReportIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import CreateIssueDialog from "./CreateIssueDialog";
import CreateProjectDialog from "./CreateProjectDialog";

// ── Types ─────────────────────────────────────────────────────────

type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
};

type Notification = {
  id: string;
  type: "issue" | "comment" | "mention" | "status" | "assignment";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

// ── Styled Components ────────────────────────────────────────────

const NavbarContainer = styled(Box)(({ theme }) => ({
  height: 72,
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(0, 3),
  display: "flex",
  alignItems: "center",
  position: "sticky",
  top: 0,
  zIndex: 1100,
  backdropFilter: "blur(8px)",
  boxShadow: theme.shadows[1],
}));

const SearchField = styled(TextField)(({ theme }) => ({
  flex: 1,
  maxWidth: 400,
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.spacing(2),
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.background.paper,
      boxShadow: theme.shadows[2],
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: theme.spacing(1, 0),
  },
}));

const CreateButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#2563EB",
  textTransform: "none",
  padding: theme.spacing(0.75, 3),
  height: 40,
  borderRadius: theme.spacing(1.5),
  fontWeight: 600,
  "&:hover": {
    backgroundColor: "#1D4ED8",
    boxShadow: theme.shadows[4],
  },
  "&:active": {
    transform: "scale(0.98)",
  },
}));

const ProfileButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(0.5, 1.5),
  minWidth: "unset",
  gap: theme.spacing(1),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const NotificationButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.spacing(2),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

// ── Notification Item ────────────────────────────────────────────

function NotificationItem({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "issue":
        return <BugReportIcon fontSize="small" color="primary" />;
      case "comment":
        return <PersonIcon fontSize="small" color="info" />;
      case "mention":
        return <PersonIcon fontSize="small" color="warning" />;
      case "status":
        return <DashboardIcon fontSize="small" color="success" />;
      case "assignment":
        return <PersonIcon fontSize="small" color="secondary" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  return (
    <ListItem
      button
      onClick={() => {
        onMarkRead(notification.id);
        if (notification.link) {
          window.location.href = notification.link;
        }
        onClose();
      }}
      sx={{
        px: 2,
        py: 1.5,
        borderLeft: notification.read ? "none" : `3px solid #2563EB`,
        backgroundColor: notification.read ? "transparent" : "action.hover",
        "&:hover": {
          backgroundColor: "action.selected",
        },
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ width: 36, height: 36, bgcolor: "action.hover" }}>
          {getIcon()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
            {notification.title}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            {notification.message} · {new Date(notification.createdAt).toLocaleDateString()}
          </Typography>
        }
      />
    </ListItem>
  );
}

// ── Main Component ──────────────────────────────────────────────

type Props = {
  project?: any;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  notifications?: Notification[];
  onNotificationRead?: (id: string) => void;
};

export default function Navbar({
  project,
  onThemeToggle,
  isDarkMode = false,
  notifications = [],
  onNotificationRead,
}: Props) {
  // ── State ──────────────────────────────────────────────────────
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileMenu, setProfileMenu] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Effects ────────────────────────────────────────────────────

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  // Profile fetch
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch profile");
        }

        setProfile(data.data);
      } catch (error) {
        console.error("Profile fetch error:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenu(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenu(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    handleProfileMenuClose();
    router.push("/login");
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationRead = (id: string) => {
    if (onNotificationRead) {
      onNotificationRead(id);
    }
    // Update local state
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleCreateMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCreateMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSearchResults(false);
      setSearchQuery("");
    }
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Ctrl/Cmd + N to create issue
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setOpenIssueDialog(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Render ────────────────────────────────────────────────────

  const isHomePage = pathname === "/dashboard" || pathname === "/";

  return (
    <NavbarContainer>
      {/* ── Left Section ── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Logo */}
        <Box
          onClick={() => router.push("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            mr: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: "#2563EB",
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            P
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              display: { xs: "none", sm: "block" },
            }}
          >
            Projex
          </Typography>
        </Box>

        {/* Search */}
        <Box ref={searchRef} sx={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <SearchField
            size="small"
            placeholder="Search projects, issues, or people... (Ctrl+K)"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Search Results Dropdown */}
          <Popper
            open={showSearchResults && searchResults.length > 0}
            anchorEl={searchRef.current}
            placement="bottom-start"
            transition
            sx={{
              width: searchRef.current?.offsetWidth || 400,
              zIndex: 1300,
            }}
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={200}>
                <Paper
                  elevation={4}
                  sx={{
                    mt: 1,
                    maxHeight: 400,
                    overflow: "auto",
                    borderRadius: 2,
                  }}
                >
                  <List dense>
                    {searchResults.slice(0, 8).map((result) => (
                      <ListItem
                        key={result.id}
                        button
                        onClick={() => {
                          router.push(result.url || `/issues/${result.id}`);
                          setShowSearchResults(false);
                          setSearchQuery("");
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "action.hover" }}>
                            {result.type === "project" ? (
                              <DashboardIcon fontSize="small" />
                            ) : result.type === "issue" ? (
                              <BugReportIcon fontSize="small" />
                            ) : (
                              <PersonIcon fontSize="small" />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={result.title || result.name}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {result.type} · {result.key || result.email || ""}
                            </Typography>
                          }
                        />
                        {result.status && (
                          <Chip
                            label={result.status}
                            size="small"
                            sx={{ height: 20, fontSize: "0.625rem" }}
                          />
                        )}
                      </ListItem>
                    ))}
                    {searchResults.length > 8 && (
                      <ListItem
                        button
                        onClick={() => {
                          router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                          setShowSearchResults(false);
                        }}
                      >
                        <ListItemText
                          primary={`View all ${searchResults.length} results`}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            color: "primary",
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Fade>
            )}
          </Popper>
        </Box>

        {/* Create Button */}
        <Tooltip title="Create new (Ctrl+N)">
          <CreateButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateMenuOpen}
          >
            Create
          </CreateButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCreateMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 200,
              boxShadow: 4,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleCreateMenuClose();
              setOpenIssueDialog(true);
            }}
            sx={{ py: 1.5 }}
          >
            <BugReportIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Create Issue
            <Chip
              label="N"
              size="small"
              sx={{ ml: "auto", height: 20, fontSize: "0.625rem" }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleCreateMenuClose();
              setOpenProjectDialog(true);
            }}
            sx={{ py: 1.5 }}
          >
            <CreateNewFolderIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Create Project
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              handleCreateMenuClose();
              // Open quick create with template
            }}
            sx={{ py: 1.5 }}
          >
            <DashboardIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Quick Create from Template
          </MenuItem>
        </Menu>
      </Box>

      {/* ── Right Section ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* Theme Toggle */}
        {onThemeToggle && (
          <Tooltip title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}>
            <IconButton onClick={onThemeToggle} sx={{ borderRadius: 2 }}>
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications */}
        <Tooltip title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}>
          <NotificationButton onClick={handleNotificationOpen}>
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: 10,
                  height: 18,
                  minWidth: 18,
                },
              }}
            >
              {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
            </Badge>
          </NotificationButton>
        </Tooltip>

        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 420,
              mt: 1,
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 8px 30px rgba(0,0,0,.12)",
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
                onClick={() => {
                  // Mark all as read
                  notifications.forEach((n) => {
                    if (!n.read) handleNotificationRead(n.id);
                  });
                }}
              >
                Mark all read
              </Button>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <NotificationsNoneIcon sx={{ fontSize: 48, color: "action.disabled", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                We'll notify you when something happens
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClose={handleNotificationClose}
                  onMarkRead={handleNotificationRead}
                />
              ))}
              {notifications.length > 10 && (
                <Box sx={{ p: 1, textAlign: "center", borderTop: "1px solid", borderColor: "divider" }}>
                  <Button
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={() => {
                      handleNotificationClose();
                      router.push("/notifications");
                    }}
                  >
                    View all notifications
                  </Button>
                </Box>
              )}
            </List>
          )}
        </Menu>

        {/* Help */}
        <Tooltip title="Help & Support">
          <IconButton sx={{ borderRadius: 2 }}>
            <HelpIcon />
          </IconButton>
        </Tooltip>

        {/* Profile */}
        {loading ? (
          <CircularProgress size={32} />
        ) : profile ? (
          <>
            <ProfileButton onClick={handleProfileMenuOpen}>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: "primary.main",
                  fontWeight: 600,
                }}
                src={profile.avatarUrl || undefined}
              >
                {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: 14,
                    lineHeight: 1.2,
                  }}
                >
                  {profile.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "text.secondary",
                  }}
                >
                  {profile.email}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon sx={{ ml: 0.5 }} />
            </ProfileButton>

            <Menu
              anchorEl={profileMenu}
              open={Boolean(profileMenu)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  width: 290,
                  mt: 1,
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,.12)",
                },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "primary.main",
                    fontSize: 24,
                  }}
                  src={profile.avatarUrl || undefined}
                >
                  {profile.name?.charAt(0).toUpperCase()}
                </Avatar>

                <Box>
                  <Typography fontWeight={700} fontSize={16}>
                    {profile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.email}
                  </Typography>
                  {profile.role && (
                    <Chip
                      label={profile.role}
                      size="small"
                      sx={{ mt: 0.5, height: 20, fontSize: "0.625rem" }}
                    />
                  )}
                </Box>
              </Box>

              <Divider />

              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  router.push("/profile");
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  router.push("/settings");
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  // Open feedback dialog
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <FeedbackIcon fontSize="small" />
                </ListItemIcon>
                Send Feedback
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  color: "error.main",
                }}
              >
                <ListItemIcon>
                  <LogoutIcon color="error" fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            variant="outlined"
            onClick={() => router.push("/login")}
            sx={{ borderRadius: 2 }}
          >
            Login
          </Button>
        )}
      </Box>

      {/* ── Dialogs ── */}
      <CreateIssueDialog
        open={openIssueDialog}
        onClose={() => setOpenIssueDialog(false)}
        projectId={project?.id}
        projectKey={project?.key}
        statuses={project?.statuses ?? []}
        members={project?.members ?? []}
        defaultStatusId={
          project?.statuses?.find((s: any) => s.isDefault)?.id ??
          project?.statuses?.[0]?.id ??
          ""
        }
        onCreated={(issue) => {
          console.log("Issue created:", issue);
          setOpenIssueDialog(false);
          // Refresh or redirect
          router.refresh();
        }}
      />

      <CreateProjectDialog
        open={openProjectDialog}
        onClose={() => setOpenProjectDialog(false)}
        onCreated={(project: { id: any; }) => {
          console.log("Project created:", project);
          setOpenProjectDialog(false);
          router.push(`/projects/${project.id}`);
        }}
      />
    </NavbarContainer>
  );
}