#pragma once

#include <string>
#include <vector>
#include <memory>
#include <filesystem>
#include <functional>
#include <nlohmann/json.hpp>

#include "ui/WindowManager.h"
#include "ui/DockingManager.h"
#include "ui/ToolbarManager.h"
#include "core/Error.h"
#include "core/Log.h"

namespace rebel_cad {
namespace ui {

/**
 * @brief Manages saving and loading of workspace configurations
 * 
 * The WorkspaceManager class handles the persistence of UI configurations,
 * allowing users to save their preferred workspace layouts and restore them
 * later. It coordinates with other UI managers to capture and restore their
 * states.
 */
/**
 * @brief Represents a draggable UI element's position and state
 */
struct DraggableElement {
    int id;                     // Unique identifier for the element
    std::string type;          // Type of UI element (window, toolbar, panel)
    float x, y;                // Current position
    float width, height;       // Current dimensions
    bool isDocked;             // Whether the element is currently docked
    std::string dockLocation;  // Dock location if docked (e.g., "left", "right", "top", "bottom")
};

/**
 * @brief Callback function type for drag and drop events
 */
using DragDropCallback = std::function<void(const DraggableElement&, const DraggableElement&)>;

class WorkspaceManager {
public:
    /**
     * @brief Construct a new Workspace Manager
     * 
     * @param window_mgr Pointer to the window manager
     * @param docking_mgr Pointer to the docking manager
     * @param toolbar_mgr Pointer to the toolbar manager
     */
    WorkspaceManager(
        std::shared_ptr<WindowManager> window_mgr,
        std::shared_ptr<DockingManager> docking_mgr,
        std::shared_ptr<ToolbarManager> toolbar_mgr
    );

    /**
     * @brief Save current workspace configuration to a file
     * 
     * @param name Name of the workspace configuration
     * @return Error Success or failure with error message
     */
    Error SaveWorkspace(const std::string& name);

    /**
     * @brief Load and apply a workspace configuration
     * 
     * @param name Name of the workspace configuration to load
     * @return Error Success or failure with error message
     */
    Error LoadWorkspace(const std::string& name);

    /**
     * @brief Get list of available workspace configurations
     * 
     * @return std::vector<std::string> List of workspace names
     */
    std::vector<std::string> GetAvailableWorkspaces() const;

    /**
     * @brief Delete a saved workspace configuration
     * 
     * @param name Name of the workspace to delete
     * @return Error Success or failure with error message
     */
    Error DeleteWorkspace(const std::string& name);

    /**
     * @brief Start dragging a UI element
     * 
     * @param element The element being dragged
     * @return Error Success or failure with error message
     */
    Error BeginDrag(const DraggableElement& element);

    /**
     * @brief Update the position of a dragged element
     * 
     * @param x New x coordinate
     * @param y New y coordinate
     * @return Error Success or failure with error message
     */
    Error UpdateDragPosition(float x, float y);

    /**
     * @brief End the drag operation and finalize element placement
     * 
     * @param target Target element or dock location
     * @return Error Success or failure with error message
     */
    Error EndDrag(const DraggableElement& target);

    /**
     * @brief Register a callback for drag and drop events
     * 
     * @param callback Function to be called when drag and drop occurs
     */
    void SetDragDropCallback(DragDropCallback callback);

    /**
     * @brief Check if a position is valid for dropping
     * 
     * @param x X coordinate to check
     * @param y Y coordinate to check
     * @return bool True if position is valid for dropping
     */
    bool IsValidDropTarget(float x, float y) const;

    /**
     * @brief Get the currently dragged element if any
     * 
     * @return DraggableElement* Pointer to dragged element or nullptr if none
     */
    const DraggableElement* GetDraggedElement() const;

private:
    DraggableElement* current_drag_;
    DragDropCallback drag_drop_callback_;
    std::shared_ptr<WindowManager> window_manager_;
    std::shared_ptr<DockingManager> docking_manager_;
    std::shared_ptr<ToolbarManager> toolbar_manager_;

    std::filesystem::path GetWorkspacePath(const std::string& name) const;
    Error ValidateWorkspaceName(const std::string& name) const;
    nlohmann::json SerializeCurrentState() const;
    Error DeserializeAndApplyState(const nlohmann::json& state);
};

} // namespace ui
} // namespace rebel_cad
