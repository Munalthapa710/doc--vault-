using System.Data;

namespace PersonalVault.Api.Service.Dapper;

public interface IDapperConnectionFactory
{
    IDbConnection CreateConnection();
}
