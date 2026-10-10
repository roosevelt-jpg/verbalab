variable "aws_region" {
  type        = string
  description = "AWS region for EKS (ADR-0059)."
  default     = "af-south-1"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name."
  default     = "lugemi"
}

variable "kubernetes_version" {
  type        = string
  description = "EKS Kubernetes version."
  default     = "1.31"
}

variable "node_instance_types" {
  type        = list(string)
  description = "Managed node group instance types."
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  type        = number
  description = "Desired managed node count."
  default     = 2
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}
