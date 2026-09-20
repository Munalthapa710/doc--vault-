namespace PersonalVault.Api.ViewModel.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Rows { get; set; } = [];
    public long Total { get; set; }
    public int Page { get; set; }
    public int Pages { get; set; }
}
