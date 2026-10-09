using System.Security.Cryptography;

namespace AAP_TUUA.Business.Util;

public class Security
{
    //hash password
    public static string HashPassword(string password, out byte[] salt)
    {
        // Generate a secure random salt
        salt = RandomNumberGenerator.GetBytes(16); // Recommended salt length for security

        // Use PBKDF2 for hashing with a strong iteration count
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 10000, HashAlgorithmName.SHA1, 32);

        // Convert the hashed bytes to a base64-encoded string for storage
        return Convert.ToBase64String(hash); // 32 bytes for SHA-256
    }

    public static bool VerifyPassword(string password, string hash, byte[] salt)
    {
        // Convert the base64-encoded hash to a byte array
        var hashedPassword = Convert.FromBase64String(hash);

        // Use PBKDF2 for hashing with a strong iteration count
        var computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 10000, HashAlgorithmName.SHA1, 32);

        // Compare the hashed password with the stored hash
        return hashedPassword.SequenceEqual(computedHash); // 32 bytes for SHA-256
    }
}
