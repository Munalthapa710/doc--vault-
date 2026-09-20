using System.Data;
using Microsoft.Data.SqlClient;

namespace PersonalVault.Api.Service.Dapper;

public class SqlConnectionFactory(IConfiguration configuration) : IDapperConnectionFactory
{
    public IDbConnection CreateConnection()
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        return new SqlConnection(connectionString);
    }
}
