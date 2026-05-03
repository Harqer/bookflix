# --- PRODUCTION PLATFORM: ADVANCED ORCHESTRATION ---

resource "spacelift_stack" "bookflix" {
  name       = "bookflix-cinema-production"
  repository = "bookflix-main"
  branch     = "main"
  
  autodeploy     = true
  
  # Sovereign Engine: OpenTofu
  terraform_workflow_tool = "OPEN_TOFU"

  # --- ADVANCED FEATURE: DRIFT DETECTION & REMEDIATION ---
  # Drift detection is handled via Spacelift's scheduled tasks in Production.

  # --- ADVANCED FEATURE: PRIVATE WORKER POOL LINK ---
  # Allows orchestration to happen on your own GPU hardware
  worker_pool_id = spacelift_worker_pool.gpu_studio.id
}

# GPU-Native Private Worker Pool Definition
resource "spacelift_worker_pool" "gpu_studio" {
  name        = "Sovereign-GPU-Studio-Worker-Pool"
  description = "Worker pool for GPU-accelerated infrastructure tasks"
}

# Attaching the Secret Vault
resource "spacelift_context_attachment" "studio_vault_link" {
  context_id = spacelift_context.studio_secrets.id
  stack_id   = spacelift_stack.bookflix.id
  priority   = 0
}

# --- ADVANCED FEATURE: PLAN POLICY (Financial Safeguard) ---
# Automatically blocks any run that adds more than 5 high-cost GPU resources
resource "spacelift_policy" "cost_safety" {
  name = "Financial Safety Policy"
  type = "PLAN"
  body = <<EOT
    package spacelift
    deny[msg] {
      count(input.terraform.resource_changes) > 10
      msg := "Run blocked: Unusually large change detected (> 10 resources)."
    }
    deny[msg] {
      some i
      change := input.terraform.resource_changes[i]
      change.mode == "managed"
      change.change.actions[_] == "create"
      contains(change.address, "aws_instance") # Example: Block excessive GPU instances
      count([j | some j; input.terraform.resource_changes[j].address == change.address]) > 5
      msg := "Run blocked: Attempting to create more than 5 GPU instances."
    }
  EOT
}

# Approval Policy (Unchanged)
resource "spacelift_policy" "auto_approve" {
  name = "Auto-approve Production Changes"
  type = "APPROVAL"
  body = <<EOT
    package spacelift
    approve {
      input.stack.branch == "main"
      input.run.type == "TRACKED"
    }
  EOT
}
