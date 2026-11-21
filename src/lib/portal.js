export const PORTALS = {
  admin: {
    home: "/admin-console",
    label: "Admin portal",
    blurb: "Review submitted blueprints, verify creators and run platform operations.",
  },
  creator: {
    home: "/creator-dashboard",
    label: "Creator portal",
    blurb: "Build blueprints, submit them for review and track their approval.",
  },
  user: {
    home: "/my-dashboard",
    label: "Seeker portal",
    blurb: "Saved blueprints, purchases and the businesses you are building.",
  },
};

export function portalHome(role) {
  return (PORTALS[role] || PORTALS.user).home;
}

export function portalLabel(role) {
  return (PORTALS[role] || PORTALS.user).label;
}