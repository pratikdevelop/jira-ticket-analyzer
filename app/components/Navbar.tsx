"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CreateIssueDialog from "./CreateIssueDialog";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import BugReportIcon from "@mui/icons-material/BugReport";

import CreateProjectDialog from "./CreateProjectDialog";
import {
  Typography,
  Divider,
  IconButton,
  ListItemIcon,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const Page = ({ project }: { project: any }) => {

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileMenu, setProfileMenu] = useState<null | HTMLElement>(null);

const openProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
  setProfileMenu(event.currentTarget);
};

const closeProfileMenu = () => {
  setProfileMenu(null);
};

const handleLogout = () => {
  localStorage.removeItem("token");
  closeProfileMenu();
  router.push("/login");
};

  const [openIssueDialog, setOpenIssueDialog] = useState(false);

  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    console.log("Token on page load:", token);

    if (!token) {
      console.log("No token found, redirecting to login");
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/profile",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log("Profile API Response:", data);

        if (!response.ok) {
          alert(data.error || "Failed to fetch profile");
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setProfile(data.data);
          console.log("Profile loaded:", data.data);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <Box
      sx={{
        height: 80,
        border: "1px solid #CBD5E1",
        bgcolor: "white",
        px: 3,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Left Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search projects..."
          variant="outlined"
          fullWidth
        /><Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            backgroundColor: "#2563eb",
            textTransform: "none",
            px: 3,
            height: 40,
            "&:hover": {
              backgroundColor: "#1d4ed8",
            },
          }}
        >
          Create
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setOpenIssueDialog(true);
            }}
          >
            <BugReportIcon sx={{ mr: 1 }} />
            Create Issue
          </MenuItem>

          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setOpenProjectDialog(true);
            }}
          >
            <CreateNewFolderIcon sx={{ mr: 1 }} />
            Create Project
          </MenuItem>
        </Menu>
      </Box>

      {/* Right Section */}
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 2,
  }}
>
  {profile ? (
    <>
      <Button
        onClick={openProfileMenu}
        sx={{
          textTransform: "none",
          color: "#111827",
          borderRadius: 2,
          px: 1,
          py: 0.5,
        }}
        endIcon={<KeyboardArrowDownIcon />}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "primary.main",
            mr: 1,
          }}
        >
          {profile.name?.charAt(0).toUpperCase()}
        </Avatar>

        <Box textAlign="left">
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
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            {profile.email}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={profileMenu}
        open={Boolean(profileMenu)}
        onClose={closeProfileMenu}
        PaperProps={{
          sx: {
            width: 260,
            mt: 1,
            borderRadius: 2,
            boxShadow: 4,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
          }}
        >
          <Stack direction="row" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
              }}
            >
              {profile.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Box>
              <Typography fontWeight={600}>
                {profile.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {profile.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <MenuItem>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>

          My Profile
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>

          Settings
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: "error.main",
          }}
        >
          <ListItemIcon>
            <LogoutIcon
              color="error"
              fontSize="small"
            />
          </ListItemIcon>

          Logout
        </MenuItem>
      </Menu>
    </>
  ) : (
    <Button
      variant="outlined"
      onClick={() => router.push("/login")}
    >
      Login
    </Button>
  )}
</Box>
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
          console.log(issue);
          setOpenIssueDialog(false);
        }}
      />

      <CreateProjectDialog
        open={openProjectDialog}
        onClose={() => setOpenProjectDialog(false)}
      />
    </Box>
  );
};

export default Page;