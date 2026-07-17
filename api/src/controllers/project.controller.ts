// controllers/project.controller.ts

import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import * as ProjectService from "../services/project.service.js";

// ======================================
// CREATE PROJECT
// ======================================

export const createProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const project = await ProjectService.createProject(
      req.user!.userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (error: any) {
    console.error("[ProjectController.createProject]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// GET ALL PROJECTS
// ======================================

export const getProjects = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const projects = await ProjectService.getProjects(
      req.user!.userId
    );

    return res.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    console.error("[ProjectController.getProjects]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// GET PROJECT BY ID
// ======================================

export const getProjectById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId }: any = req.params;

    const project = await ProjectService.getProjectById(
      req.user!.userId,
      projectId
    );

    return res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error("[ProjectController.getProjectById]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// UPDATE PROJECT
// ======================================

export const updateProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId } : any = req.params;

    const project = await ProjectService.updateProject(
      req.user!.userId,
      projectId,
      req.body
    );

    return res.json({
      success: true,
      message: "Project updated successfully.",
      data: project,
    });
  } catch (error: any) {
    console.error("[ProjectController.updateProject]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// DELETE PROJECT
// ======================================

export const deleteProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId } : any = req.params;

    await ProjectService.deleteProject(
      req.user!.userId,
      projectId
    );

    return res.json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error: any) {
    console.error("[ProjectController.deleteProject]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// INVITE MEMBER
// ======================================

export const inviteMember = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId } : any = req.params;

    const member = await ProjectService.inviteMember(
      req.user!.userId,
      projectId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Member invited successfully.",
      data: member,
    });
  } catch (error: any) {
    console.error("[ProjectController.inviteMember]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// REMOVE MEMBER
// ======================================

export const removeMember = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId, userId } : any = req.params;

    await ProjectService.removeMember(
      req.user!.userId,
      projectId,
      userId
    );

    return res.json({
      success: true,
      message: "Member removed successfully.",
    });
  } catch (error: any) {
    console.error("[ProjectController.removeMember]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// ======================================
// CHANGE MEMBER ROLE
// ======================================

export const changeMemberRole = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId, userId } : any = req.params;
    const { role } : any = req.body;

    const member = await ProjectService.changeMemberRole(
      req.user!.userId,
      projectId,
      userId,
      role
    );

    return res.json({
      success: true,
      message: "Member role updated successfully.",
      data: member,
    });
  } catch (error: any) {
    console.error("[ProjectController.changeMemberRole]", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};


// ===============================
// GET PROJECT MEMBERS
// ===============================
export const getProjectMembers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId }: any = req.params;

    const result = await ProjectService.getProjectMembers(
      projectId,
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===============================
// GET PROJECT STATUSES
// ===============================
export const getProjectStatuses = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId }: any = req.params;

    const result = await ProjectService.getProjectStatuses(
      projectId,
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===============================
// CREATE STATUS
// ===============================
export const createStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId }: any = req.params;

    const result = await ProjectService.createStatus(
      projectId,
      req.user!.userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      data: result,
      message: "Status created successfully",
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===============================
// UPDATE STATUS
// ===============================
export const updateStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { statusId }: any = req.params;

    const result = await ProjectService.updateStatus(
      statusId,
      req.user!.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Status updated successfully",
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===============================
// DELETE STATUS
// ===============================
export const deleteStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { statusId }: any = req.params;

    await ProjectService.deleteStatus(
      statusId,
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      message: "Status deleted successfully",
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===============================
// REORDER STATUSES
// ===============================
export const reorderStatuses = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId }: any = req.params;

    const result = await ProjectService.reorderStatuses(
      projectId,
      req.user!.userId,
      req.body.statuses
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Statuses reordered successfully",
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};