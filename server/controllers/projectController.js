const { Project, User } = require('../models');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Admin/Team/Client)
const getProjects = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'client') {
      whereClause.client_id = req.user.id;
    }

    const projects = await Project.findAll({
      where: whereClause,
      include: [{ model: User, as: 'Client', attributes: ['id', 'name', 'email'] }]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: User, as: 'Client', attributes: ['id', 'name', 'email'] }]
    });

    if (project) {
      if (req.user.role === 'client' && project.client_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this project' });
      }
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const {
      name, client_id, deadline,
      projectType, clientName, companyName, clientContact,
      teamMembers, description, techStack, status
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Map frontend status strings to DB enum values
    const statusMap = {
      'Pending': 'pending',
      'In Progress': 'in_progress',
      'Completed': 'completed',
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
    };

    const project = await Project.create({
      name,
      client_id: client_id ? parseInt(client_id) : null,
      deadline,
      projectType: projectType || null,
      clientName: clientName || null,
      companyName: companyName || null,
      clientContact: clientContact || null,
      teamMembers: teamMembers || [],
      description: description || null,
      techStack: techStack || [],
      status: statusMap[status] || 'pending',
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete project
// @route   PUT /api/projects/:id/complete
// @access  Private/Admin
const completeProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (project) {
      project.status = 'completed';
      await project.save();
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, getProjectById, createProject, completeProject };
