#include "ui/WorkspaceManager.h"
#include <fstream>
#include <regex>

namespace rebel_cad {
namespace ui {

WorkspaceManager::WorkspaceManager(
    std::shared_ptr<WindowManager> window_mgr,
    std::shared_ptr<DockingManager> docking_mgr,
    std::shared_ptr<ToolbarManager> toolbar_mgr
) : window_manager_(window_mgr),
    docking_manager_(docking_mgr),
    toolbar_manager_(toolbar_mgr),
    current_drag_(nullptr),
    drag_drop_callback_(nullptr) {
    
    // Ensure the workspaces directory exists
    std::filesystem::create_directories(
        std::filesystem::path("workspaces")
    );
}

Error WorkspaceManager::BeginDrag(const DraggableElement& element) {
    if (current_drag_) {
        return Error("A drag operation is already in progress");
    }

    // Create a new draggable element
    current_drag_ = new DraggableElement(element);
    
    // Log the start of drag operation
    LOG_INFO("Started dragging {} element (id: {})", element.type, element.id);
    
    return Error::Success();
}

Error WorkspaceManager::UpdateDragPosition(float x, float y) {
    if (!current_drag_) {
        return Error("No drag operation in progress");
    }

    current_drag_->x = x;
    current_drag_->y = y;

    return Error::Success();
}

Error WorkspaceManager::EndDrag(const DraggableElement& target) {
    if (!current_drag_) {
        return Error("No drag operation in progress");
    }

    try {
        // Validate drop target
        if (!IsValidDropTarget(target.x, target.y)) {
            delete current_drag_;
            current_drag_ = nullptr;
            return Error("Invalid drop target location");
        }

        // Handle docking if applicable
        if (target.isDocked) {
            auto result = docking_manager_->DockElement(
                current_drag_->id,
                target.dockLocation
            );
            if (!result.IsSuccess()) {
                delete current_drag_;
                current_drag_ = nullptr;
                return result;
            }
        }

        // Notify callback if registered
        if (drag_drop_callback_) {
            drag_drop_callback_(*current_drag_, target);
        }

        // Update window/toolbar position
        if (current_drag_->type == "window") {
            window_manager_->UpdateWindowPosition(
                current_drag_->id,
                target.x,
                target.y
            );
        } else if (current_drag_->type == "toolbar") {
            toolbar_manager_->UpdateToolbarPosition(
                current_drag_->id,
                target.x,
                target.y
            );
        }

        // Clean up
        delete current_drag_;
        current_drag_ = nullptr;

        return Error::Success();
    }
    catch (const std::exception& e) {
        delete current_drag_;
        current_drag_ = nullptr;
        return Error(std::string("Failed to complete drag operation: ") + e.what());
    }
}

void WorkspaceManager::SetDragDropCallback(DragDropCallback callback) {
    drag_drop_callback_ = callback;
}

bool WorkspaceManager::IsValidDropTarget(float x, float y) const {
    // Check if position is within main window bounds
    if (x < 0 || y < 0) return false;

    // Get main window dimensions from window manager
    auto main_window = window_manager_->GetMainWindow();
    if (!main_window) return false;

    return x <= main_window->GetWidth() && y <= main_window->GetHeight();
}

const DraggableElement* WorkspaceManager::GetDraggedElement() const {
    return current_drag_;
}

Error WorkspaceManager::SaveWorkspace(const std::string& name) {
    auto validation_result = ValidateWorkspaceName(name);
    if (!validation_result.IsSuccess()) {
        return validation_result;
    }

    try {
        // Serialize current state
        auto state = SerializeCurrentState();
        
        // Write to file
        std::ofstream file(GetWorkspacePath(name));
        if (!file.is_open()) {
            return Error("Failed to open workspace file for writing");
        }
        
        file << state.dump(4); // Pretty print with 4 space indent
        return Error::Success();
    }
    catch (const std::exception& e) {
        return Error(std::string("Failed to save workspace: ") + e.what());
    }
}

Error WorkspaceManager::LoadWorkspace(const std::string& name) {
    try {
        // Read file
        std::ifstream file(GetWorkspacePath(name));
        if (!file.is_open()) {
            return Error("Workspace file not found");
        }

        nlohmann::json state;
        file >> state;

        // Apply the configuration
        return DeserializeAndApplyState(state);
    }
    catch (const std::exception& e) {
        return Error(std::string("Failed to load workspace: ") + e.what());
    }
}

std::vector<std::string> WorkspaceManager::GetAvailableWorkspaces() const {
    std::vector<std::string> workspaces;
    
    for (const auto& entry : std::filesystem::directory_iterator("workspaces")) {
        if (entry.path().extension() == ".json") {
            workspaces.push_back(entry.path().stem().string());
        }
    }
    
    return workspaces;
}

Error WorkspaceManager::DeleteWorkspace(const std::string& name) {
    try {
        auto path = GetWorkspacePath(name);
        if (!std::filesystem::exists(path)) {
            return Error("Workspace does not exist");
        }
        
        std::filesystem::remove(path);
        return Error::Success();
    }
    catch (const std::exception& e) {
        return Error(std::string("Failed to delete workspace: ") + e.what());
    }
}

std::filesystem::path WorkspaceManager::GetWorkspacePath(const std::string& name) const {
    return std::filesystem::path("workspaces") / (name + ".json");
}

Error WorkspaceManager::ValidateWorkspaceName(const std::string& name) const {
    // Check for empty name
    if (name.empty()) {
        return Error("Workspace name cannot be empty");
    }

    // Check for valid filename characters
    std::regex valid_name_regex("^[a-zA-Z0-9_-]+$");
    if (!std::regex_match(name, valid_name_regex)) {
        return Error("Workspace name can only contain letters, numbers, underscores, and hyphens");
    }

    return Error::Success();
}

nlohmann::json WorkspaceManager::SerializeCurrentState() const {
    nlohmann::json state;

    // Get state from each manager
    state["windows"] = window_manager_->SerializeState();
    state["docking"] = docking_manager_->SerializeState();
    state["toolbars"] = toolbar_manager_->SerializeState();
    
    // Add drag & drop state if applicable
    if (current_drag_) {
        state["drag_state"] = {
            {"element_id", current_drag_->id},
            {"element_type", current_drag_->type},
            {"position_x", current_drag_->x},
            {"position_y", current_drag_->y},
            {"is_docked", current_drag_->isDocked},
            {"dock_location", current_drag_->dockLocation}
        };
    }
    
    // Add metadata
    state["version"] = "1.0";
    state["timestamp"] = std::chrono::system_clock::now().time_since_epoch().count();

    return state;
}

Error WorkspaceManager::DeserializeAndApplyState(const nlohmann::json& state) {
    try {
        // Version check
        std::string version = state.at("version");
        if (version != "1.0") {
            return Error("Unsupported workspace format version");
        }

        // Apply state to each manager
        auto window_result = window_manager_->DeserializeState(state.at("windows"));
        if (!window_result.IsSuccess()) return window_result;

        auto docking_result = docking_manager_->DeserializeState(state.at("docking"));
        if (!docking_result.IsSuccess()) return docking_result;

        auto toolbar_result = toolbar_manager_->DeserializeState(state.at("toolbars"));
        if (!toolbar_result.IsSuccess()) return toolbar_result;

        return Error::Success();
    }
    catch (const std::exception& e) {
        return Error(std::string("Failed to apply workspace state: ") + e.what());
    }
}

} // namespace ui
} // namespace rebel_cad
