import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import Reservations from './reservations';
import Calendar from './calendar';

export default function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [hostListings, setHostListings] = useState([]);
  const [filters, setFilters] = useState({
    status: 'All',
    listingTitle: 'All Listings',
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHostReservations = async () => {
      try {
        const response = await fetch(`http://localhost:5000/reservations/hosts`, {
          credentials: 'include'
        });

        const data = await response.json();

        if (!data.reservations) throw new Error('Invalid response format');

        const transformed = data.reservations.map(res => ({
          ...res,
          listingTitle: res.listing_title || 'Unknown Listing',
          checkIn: res.check_in,
          checkOut: res.check_out,
          totalPrice: res.total_price,
          host: res.host || 'Unknown Host'
        }));

        setReservations(transformed);
        setFilteredReservations(transformed);
        setHostListings(data.listings || []);
      } catch (error) {
        console.error('Full error:', error);
        setError(error.message);
        if (error.message.includes('401')) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostReservations();
  }, []);

  useEffect(() => {
    const filtered = reservations.filter(reservation => {
      if (filters.status !== 'All' && reservation.status !== filters.status) return false;
      if (filters.listingTitle !== 'All Listings' && reservation.listingTitle !== filters.listingTitle) return false;

      const checkInDate = new Date(reservation.checkIn);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && checkInDate < startDate) return false;
      if (endDate && checkInDate > endDate) return false;

      return true;
    });

    setFilteredReservations(filtered);
  }, [filters, reservations]);

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/reservations/${reservationId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update reservation status');

      setReservations(prev =>
        prev.map(res =>
          res._id === reservationId ? { ...res, status: newStatus } : res
        )
      );
    } catch (error) {
      console.error('Error updating reservation:', error);
      setError(`Failed to update reservation: ${error.message}`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/auth/hosts/logout", {
        method: "POST",
        credentials: 'include'
      });
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const uniqueListingTitles = [...new Set(reservations.map(res => res.listingTitle))].sort();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Host Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Sign Out</button>
      </div>

      <Calendar reservations={filteredReservations} />

      <Reservations 
        filteredReservations={filteredReservations}
        filters={filters}
        uniqueListingTitles={uniqueListingTitles}
        handleFilterChange={handleFilterChange}
        handleStatusChange={handleStatusChange}
      />
    </div>
  );
}
