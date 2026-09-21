const { Milestone, Project, User } = require('../models');

// @desc    Get milestones for a project
// @route   GET /api/milestones/project/:projectId
// @access  Private
const getProjectMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.findAll({
      where: { project_id: req.params.projectId },
      include: [{ model: User, as: 'AssignedTeam', attributes: ['id', 'name', 'email'] }]
    });
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a milestone
// @route   POST /api/milestones
// @access  Private/Admin
const createMilestone = async (req, res) => {
  try {
    const { project_id, title, description, amount, deadline, assigned_to } = req.body;
    const milestone = await Milestone.create({
      project_id,
      title,
      description,
      amount,
      deadline,
      assigned_to
    });
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a milestone (Submit work)
// @route   PUT /api/milestones/:id/submit
// @access  Private/Team/Admin
const submitMilestoneWork = async (req, res) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id);

    if (milestone) {
      if (req.user.role === 'team' && milestone.assigned_to !== req.user.id) {
        return res.status(403).json({ message: 'Not assigned to this milestone' });
      }

      milestone.status = 'submitted';
      // In a real app we'd save the file URL here if uploaded
      await milestone.save();
      res.json(milestone);
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a milestone
// @route   PUT /api/milestones/:id/approve
// @access  Private/Client/Admin
const approveMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id);
    if (milestone) {
      milestone.status = 'approved';
      await milestone.save();
      res.json(milestone);
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjectMilestones, createMilestone, submitMilestoneWork, approveMilestone };
