namespace JobConnect.API.Models;

public enum UserRole
{
    Candidate,
<<<<<<< HEAD
    Company
=======
    Company,
    Admin
>>>>>>> upstream/main
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
<<<<<<< HEAD
=======
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
>>>>>>> upstream/main
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public CandidateProfile? CandidateProfile { get; set; }
    public Company? Company { get; set; }
}
