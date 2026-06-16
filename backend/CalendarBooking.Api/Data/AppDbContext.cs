using Microsoft.EntityFrameworkCore;
using CalendarBooking.Api.Models;

namespace CalendarBooking.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<EventType> EventTypes => Set<EventType>();
    public DbSet<Slot> Slots => Set<Slot>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EventType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000);
            e.HasIndex(x => x.OwnerId);
        });

        modelBuilder.Entity<Slot>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.EventType)
                .WithMany()
                .HasForeignKey(x => x.EventTypeId);
            e.HasIndex(x => new { x.EventTypeId, x.StartTime });
        });

        modelBuilder.Entity<Booking>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.GuestName).HasMaxLength(200).IsRequired();
            e.Property(x => x.GuestEmail).HasMaxLength(300).IsRequired();
            e.HasOne(x => x.Slot)
                .WithMany()
                .HasForeignKey(x => x.SlotId);
            e.HasIndex(x => x.SlotId).IsUnique();
        });
    }
}
