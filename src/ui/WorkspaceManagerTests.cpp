#include <gtest/gtest.h>
#include <memory>
#include <filesystem>
#include "ui/WorkspaceManager.h"
#include "ui/WindowManager.h"
#include "ui/DockingManager.h"
#include "ui/ToolbarManager.h"

namespace rebel_cad {
namespace ui {
namespace tests {

class WorkspaceManagerTests : public ::testing::Test {
protected:
    void SetUp() override {
        window_manager_ = std::make_shared<WindowManager>();
        docking_manager_ = std::make_shared<DockingManager>();
        toolbar_manager_ = std::make_shared<ToolbarManager>();
        
        workspace_manager_ = std::make_unique<WorkspaceManager>(
            window_manager_,
            docking_manager_,
            toolbar_manager_
        );

        // Clean up any test workspaces from previous runs
        if (std::filesystem::exists("workspaces")) {
            std::filesystem::remove_all("workspaces");
        }
    }

    void TearDown() override {
        // Clean up test workspaces
        if (std::filesystem::exists("workspaces")) {
            std::filesystem::remove_all("workspaces");
        }
    }

    std::shared_ptr<WindowManager> window_manager_;
    std::shared_ptr<DockingManager> docking_manager_;
    std::shared_ptr<ToolbarManager> toolbar_manager_;
    std::unique_ptr<WorkspaceManager> workspace_manager_;
};

TEST_F(WorkspaceManagerTests, ValidateWorkspaceNameEmpty) {
    auto result = workspace_manager_->SaveWorkspace("");
    EXPECT_FALSE(result.IsSuccess());
    EXPECT_EQ(result.GetMessage(), "Workspace name cannot be empty");
}

TEST_F(WorkspaceManagerTests, ValidateWorkspaceNameInvalidChars) {
    auto result = workspace_manager_->SaveWorkspace("test workspace!");
    EXPECT_FALSE(result.IsSuccess());
    EXPECT_EQ(result.GetMessage(), 
        "Workspace name can only contain letters, numbers, underscores, and hyphens");
}

TEST_F(WorkspaceManagerTests, SaveAndLoadWorkspace) {
    // Save a workspace
    auto save_result = workspace_manager_->SaveWorkspace("test_workspace");
    EXPECT_TRUE(save_result.IsSuccess());

    // Verify file exists
    auto workspace_path = std::filesystem::path("workspaces/test_workspace.json");
    EXPECT_TRUE(std::filesystem::exists(workspace_path));

    // Load the workspace
    auto load_result = workspace_manager_->LoadWorkspace("test_workspace");
    EXPECT_TRUE(load_result.IsSuccess());
}

TEST_F(WorkspaceManagerTests, LoadNonexistentWorkspace) {
    auto result = workspace_manager_->LoadWorkspace("nonexistent");
    EXPECT_FALSE(result.IsSuccess());
    EXPECT_EQ(result.GetMessage(), "Workspace file not found");
}

TEST_F(WorkspaceManagerTests, GetAvailableWorkspaces) {
    // Create some test workspaces
    workspace_manager_->SaveWorkspace("workspace1");
    workspace_manager_->SaveWorkspace("workspace2");
    workspace_manager_->SaveWorkspace("workspace3");

    auto workspaces = workspace_manager_->GetAvailableWorkspaces();
    EXPECT_EQ(workspaces.size(), 3);
    EXPECT_TRUE(std::find(workspaces.begin(), workspaces.end(), "workspace1") != workspaces.end());
    EXPECT_TRUE(std::find(workspaces.begin(), workspaces.end(), "workspace2") != workspaces.end());
    EXPECT_TRUE(std::find(workspaces.begin(), workspaces.end(), "workspace3") != workspaces.end());
}

TEST_F(WorkspaceManagerTests, DeleteWorkspace) {
    // Create a workspace
    workspace_manager_->SaveWorkspace("test_delete");
    EXPECT_TRUE(std::filesystem::exists("workspaces/test_delete.json"));

    // Delete it
    auto result = workspace_manager_->DeleteWorkspace("test_delete");
    EXPECT_TRUE(result.IsSuccess());
    EXPECT_FALSE(std::filesystem::exists("workspaces/test_delete.json"));
}

TEST_F(WorkspaceManagerTests, DeleteNonexistentWorkspace) {
    auto result = workspace_manager_->DeleteWorkspace("nonexistent");
    EXPECT_FALSE(result.IsSuccess());
    EXPECT_EQ(result.GetMessage(), "Workspace does not exist");
}

TEST_F(WorkspaceManagerTests, LoadIncompatibleVersion) {
    // Create a workspace file with an incompatible version
    std::filesystem::create_directories("workspaces");
    std::ofstream file("workspaces/incompatible.json");
    file << R"({
        "version": "2.0",
        "timestamp": 123456789,
        "windows": {},
        "docking": {},
        "toolbars": {}
    })";
    file.close();

    auto result = workspace_manager_->LoadWorkspace("incompatible");
    EXPECT_FALSE(result.IsSuccess());
    EXPECT_EQ(result.GetMessage(), "Unsupported workspace format version");
}

TEST_F(WorkspaceManagerTests, LoadCorruptedWorkspace) {
    // Create a corrupted workspace file
    std::filesystem::create_directories("workspaces");
    std::ofstream file("workspaces/corrupted.json");
    file << "{ invalid json content";
    file.close();

    auto result = workspace_manager_->LoadWorkspace("corrupted");
    EXPECT_FALSE(result.IsSuccess());
    EXPECT_TRUE(result.GetMessage().find("Failed to load workspace") != std::string::npos);
}

TEST_F(WorkspaceManagerTests, DragDropBasicOperation) {
    // Create a test draggable element
    DraggableElement element{
        .id = 1,
        .type = "window",
        .x = 100.0f,
        .y = 100.0f,
        .width = 200.0f,
        .height = 150.0f,
        .isDocked = false,
        .dockLocation = ""
    };

    // Begin drag
    auto begin_result = workspace_manager_->BeginDrag(element);
    EXPECT_TRUE(begin_result.IsSuccess());

    // Verify dragged element
    auto current = workspace_manager_->GetDraggedElement();
    EXPECT_NE(current, nullptr);
    EXPECT_EQ(current->id, element.id);
    EXPECT_EQ(current->type, element.type);

    // Update position
    auto update_result = workspace_manager_->UpdateDragPosition(200.0f, 150.0f);
    EXPECT_TRUE(update_result.IsSuccess());
    EXPECT_EQ(current->x, 200.0f);
    EXPECT_EQ(current->y, 150.0f);

    // End drag
    DraggableElement target{
        .id = 2,
        .type = "window",
        .x = 200.0f,
        .y = 150.0f,
        .width = 200.0f,
        .height = 150.0f,
        .isDocked = false,
        .dockLocation = ""
    };
    auto end_result = workspace_manager_->EndDrag(target);
    EXPECT_TRUE(end_result.IsSuccess());

    // Verify drag ended
    EXPECT_EQ(workspace_manager_->GetDraggedElement(), nullptr);
}

TEST_F(WorkspaceManagerTests, DragDropCallback) {
    bool callback_called = false;
    DraggableElement source_element;
    DraggableElement target_element;

    workspace_manager_->SetDragDropCallback(
        [&](const DraggableElement& source, const DraggableElement& target) {
            callback_called = true;
            source_element = source;
            target_element = target;
        }
    );

    // Perform drag & drop
    DraggableElement element{1, "window", 100.0f, 100.0f, 200.0f, 150.0f, false, ""};
    DraggableElement target{2, "window", 200.0f, 150.0f, 200.0f, 150.0f, false, ""};

    workspace_manager_->BeginDrag(element);
    workspace_manager_->EndDrag(target);

    // Verify callback was called with correct parameters
    EXPECT_TRUE(callback_called);
    EXPECT_EQ(source_element.id, element.id);
    EXPECT_EQ(target_element.id, target.id);
}

TEST_F(WorkspaceManagerTests, DragDropDocking) {
    DraggableElement element{1, "window", 100.0f, 100.0f, 200.0f, 150.0f, false, ""};
    DraggableElement target{2, "window", 200.0f, 150.0f, 200.0f, 150.0f, true, "right"};

    workspace_manager_->BeginDrag(element);
    auto result = workspace_manager_->EndDrag(target);

    EXPECT_TRUE(result.IsSuccess());
}

TEST_F(WorkspaceManagerTests, InvalidDragOperations) {
    DraggableElement element{1, "window", 100.0f, 100.0f, 200.0f, 150.0f, false, ""};

    // Try to update position without active drag
    auto update_result = workspace_manager_->UpdateDragPosition(200.0f, 150.0f);
    EXPECT_FALSE(update_result.IsSuccess());
    EXPECT_EQ(update_result.GetMessage(), "No drag operation in progress");

    // Try to end drag without active drag
    auto end_result = workspace_manager_->EndDrag(element);
    EXPECT_FALSE(end_result.IsSuccess());
    EXPECT_EQ(end_result.GetMessage(), "No drag operation in progress");

    // Start a drag
    workspace_manager_->BeginDrag(element);

    // Try to start another drag while one is in progress
    auto second_drag_result = workspace_manager_->BeginDrag(element);
    EXPECT_FALSE(second_drag_result.IsSuccess());
    EXPECT_EQ(second_drag_result.GetMessage(), "A drag operation is already in progress");
}

TEST_F(WorkspaceManagerTests, DragDropStateInWorkspace) {
    // Start a drag operation
    DraggableElement element{1, "window", 100.0f, 100.0f, 200.0f, 150.0f, false, ""};
    workspace_manager_->BeginDrag(element);

    // Save workspace with active drag
    auto save_result = workspace_manager_->SaveWorkspace("drag_test");
    EXPECT_TRUE(save_result.IsSuccess());

    // Read the saved file and verify drag state
    std::ifstream file("workspaces/drag_test.json");
    nlohmann::json saved_state;
    file >> saved_state;
    file.close();

    EXPECT_TRUE(saved_state.contains("drag_state"));
    EXPECT_EQ(saved_state["drag_state"]["element_id"], element.id);
    EXPECT_EQ(saved_state["drag_state"]["element_type"], element.type);
}

TEST_F(WorkspaceManagerTests, StateSerializationValidation) {
    // Save initial state
    auto save_result = workspace_manager_->SaveWorkspace("test_state");
    EXPECT_TRUE(save_result.IsSuccess());

    // Read the saved file content
    std::ifstream file("workspaces/test_state.json");
    nlohmann::json saved_state;
    file >> saved_state;
    file.close();

    // Verify required fields
    EXPECT_TRUE(saved_state.contains("version"));
    EXPECT_TRUE(saved_state.contains("timestamp"));
    EXPECT_TRUE(saved_state.contains("windows"));
    EXPECT_TRUE(saved_state.contains("docking"));
    EXPECT_TRUE(saved_state.contains("toolbars"));
    
    // Verify version
    EXPECT_EQ(saved_state["version"], "1.0");
}

} // namespace tests
} // namespace ui
} // namespace rebel_cad
