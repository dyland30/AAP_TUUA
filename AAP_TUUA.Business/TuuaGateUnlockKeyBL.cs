using System.Security.Cryptography;
using System.Text;
using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaGateUnlockKeyBL
{
    private const int CodeMaxLength = 50;

    private readonly TuuaGateUnlockKeyDao _unlockKeyDao;
    private readonly LocalUserDao _localUserDao;
    private readonly FeatureDao _featureDao;
    private readonly TuuaGateUnlockKeyValidator _unlockKeyValidator;

    public TuuaGateUnlockKeyBL(string cnx)
    {
        _unlockKeyDao = new TuuaGateUnlockKeyDao(cnx);
        _localUserDao = new LocalUserDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _unlockKeyValidator = new TuuaGateUnlockKeyValidator();
    }

    public async Task<IEnumerable<TuuaGateUnlockKey>?> GetAll()
    {
        return await _unlockKeyDao.GetAll();
    }

    public async Task<TuuaGateUnlockKey?> GetById(Guid id)
    {
        return await _unlockKeyDao.GetById(id);
    }
    
    //GetActiveByCode
    public async Task<TuuaGateUnlockKey?> GetActiveByCode(string code)
    {
        return await _unlockKeyDao.GetActiveByCode(code);
    }

    public async Task<IEnumerable<TuuaGateUnlockKey>?> GetByUserId(Guid userId)
    {
        return await _unlockKeyDao.GetByUserId(userId);
    }

    public async Task<TuuaGateUnlockKey> Add(TuuaGateUnlockKey key, string? userId)
    {
        var result = await _unlockKeyValidator.ValidateAsync(key);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _localUserDao.GetById(key.user_id) is null)
        {
            throw new Exception("User not found");
        }

        var type = await _featureDao.GetFeatureById(key.type_id);
        if (type is null)
        {
            throw new Exception("Unlock key type not found");
        }

        var now = DateTime.Now;
        key.created_at = now;
        key.updated_at = now;
        key.created_by = userId;
        key.modified_by = userId;
        key.is_active = true;
        key.code = GenerateCode(type.feature_value, key.user_id, now);

        return await _unlockKeyDao.Add(key);
    }

    public async Task<TuuaGateUnlockKey> Update(TuuaGateUnlockKey key, string? userId)
    {
        if (key.id is null || key.id == Guid.Empty)
        {
            throw new Exception("Unlock key id is required");
        }

        var keyDb = await _unlockKeyDao.GetById(key.id.Value);
        if (keyDb is null)
        {
            throw new Exception("Unlock key not found");
        }

        // Solo el estado es modificable; el código depende del usuario, tipo y fecha de creación.
        keyDb.is_active = key.is_active;
        keyDb.updated_at = DateTime.Now;
        keyDb.modified_by = userId;
        await _unlockKeyDao.Update(keyDb);

        return keyDb;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var keyDb = await _unlockKeyDao.GetById(id);
        if (keyDb is null)
        {
            throw new Exception("Unlock key not found");
        }

        keyDb.updated_at = DateTime.Now;
        keyDb.modified_by = userId;
        keyDb.is_active = false;
        await _unlockKeyDao.Update(keyDb);
    }

    // El código se forma como feature_value del tipo + hash(user_id + created_at), limitado a 50 caracteres.
    private static string GenerateCode(string? typeValue, Guid userId, DateTime createdAt)
    {
        var prefix = (typeValue ?? string.Empty).Trim();
        var hash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes($"{userId}{createdAt:yyyy-MM-dd HH:mm:ss.ffffff}")));
        var code = prefix + hash;
        return code.Length > CodeMaxLength ? code[..CodeMaxLength] : code;
    }
}
