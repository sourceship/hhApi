import MongoClient from "mongodb";
import dotenv from "dotenv/config";
import bcrypt from 'bcrypt'
import JWT from 'jsonwebtoken'
import moment from "moment";
import globals from "../../globals";
const sql = require('mssql')

export const GetDeviceInfo = async (req) => {
    let isAuthed = req.user.userData.userPermissions.some(perm => perm.PermissionCode === 'GPSLIST');
    if (isAuthed) {

        let customerId = req.user.userData.userInfo[0].CustomerImpersonationId;
        let deviceName = req.body.deviceName;
        // if(req.user.userData.userPermissions.includes(perm => perm.PermissionCode === 'GPSLIST'))
        // {
        try {
            await sql.connect('data source=asisprod.cwoxb7ccwa4v.us-east-1.rds.amazonaws.com,1433;initial catalog=ASISPortal;user id=asisportaluser;password=Azapuki9;MultipleActiveResultSets=True;')
            const deviceInfo = await sql.query`
        Declare @customerId int = ${customerId};
        With customerIds as ( 
            Select 
                Customer.CustomerId,
                Customer.CustomerKey,
                Customer.CustomerName,
                Customer.MarkerColor,
                Customer.CustomerId CrossRefId
            from 
                Customer 
            where 
                Customer.CustomerId = @customerId
            Union
            Select 
                Customer.CustomerId,
                Child.CustomerKey,
                Child.CustomerName,
                Child.MarkerColor,
                CustomerCrossRef.CrossRefId 
            from 
                Customer 
                Join CustomerCrossRef on 
                    Customer.CustomerId = CustomerCrossRef.CustomerId
                Join Customer Child on 
                    CustomerCrossRef.CrossRefId = Child.CustomerId
            where 
                Customer.CustomerId = @customerId
        )
        
        Select 
            GPSDevice.DeviceId,
            GPSDevice.DeviceName,
            GPSDeviceType.DeviceTypeName DeviceType,
            '' DeviceModel,
            GPSDevice.LastBatteryPercentage LastBatteryLevel,
            '' LastStatus,
            GPSDevice.LastMessage LastUpdated,
            customerIds.CustomerName CustomerName,
            IsNull(GPSDevice.IsPinging, 0 ) IsPinging,
            IsNull(GPSDevice.IsInternational, 0) IsInternational,
            GPSDevice.Latitude,
            GPSDevice.Longitude,
            GPSDevice.DeviceId RowId,
            GPSTracking.TrackingId,
            GPSDevice.IMEI
        from 
            customerIds
            Join CustomerGPSDevice on 
                customerIds.CrossRefId = CustomerGPSDevice.CustomerId
            Join GPSDevice on 
                CustomerGPSDevice.DeviceId = GPSDevice.DeviceId
            Join GPSDeviceType on 
                GPSDevice.DeviceTypeId = GPSDeviceType.DeviceTypeId
            Left Join GPSTracking on 
                GPSDevice.DeviceId = GPSTracking.DeviceId and 
                GPSTracking.StatusId in (1,2)
        where 
            GPSDevice.IsActive = 1
            ANd
            GPSDevice.DeviceName = ${deviceName}
`
            let returnVal = {
                device: deviceInfo.recordset,
            }
            console.log(returnVal);
            return returnVal
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        console.log('fuck')
    }
}


export const GetUserTrackings = async (req) => {
    let isAuthed = req.user.userData.userPermissions.some(perm => perm.PermissionCode === 'GPSLIST');
    if (isAuthed) {
        let customerId = req.user.userData.userInfo[0].CustomerImpersonationId;
        try {
            await sql.connect('data source=asisprod.cwoxb7ccwa4v.us-east-1.rds.amazonaws.com,1433;initial catalog=ASISPortal;user id=asisportaluser;password=Azapuki9;MultipleActiveResultSets=True;')
            const userTrackings = await sql.query`
        Declare @customerId int = ${customerId};

        With customerIds as ( 
            Select 
                Customer.CustomerId,
                Customer.CustomerKey,
                Customer.CustomerName,
                Customer.MarkerColor,
                Customer.BusinessUnit,
                Customer.CustomerRegion,
                Customer.CustomerId CrossRefId
            from 
                Customer 
            where 
                Customer.CustomerId = @customerId
            Union
            Select 
                Customer.CustomerId,
                Child.CustomerKey,
                Child.CustomerName,
                Child.MarkerColor,
                Child.BusinessUnit,
                Child.CustomerRegion,
                CustomerCrossRef.CrossRefId 
            from 
                Customer 
                Join CustomerCrossRef on 
                    Customer.CustomerId = CustomerCrossRef.CustomerId
                Join Customer Child on 
                    CustomerCrossRef.CrossRefId = Child.CustomerId
            where 
                Customer.CustomerId = @customerId
        )

        Select 
            GPSTracking.TrackingId,
            GPSTracking.CustomerId,
            GPSTracking.DepartueDate, 
            GPSTracking.DestinationDate,
            GPSTracking.DestinationLocationName,
            GPSTrackingEventStatus.EventStatusName,
            GPSTracking.FinalizeDate,
            customerIds.CustomerName, 
            GPSTracking.DateAdded RequestDate,
            LastLocation.EventDate LastPingDate,
            LastLocation.EventLocation LastPingLocation,
            LastLocation.MilesRemaining,
            LastLocation.Comments,
            LastLocation.IsPinging,
            LastLocation.IsDeleted,
            LastLocation.CustomerUpdated,
            LastLocation.TrackerData,
            LastLocation.Longitude,
            LastLocation.Latitude,
            GPSDeviceType.DeviceTypeName + ':' +  GpsDevice.DeviceName FullDeviceName,
            GPSDevice.IMEI, 
            LastLocation.LastBatteryPercentage,
            GPSDeviceType.DeviceTypeName DeviceType,
            LastLocation.Direction,
            LastLocation.Temperature,
            LastLocation.Pressure,

            LastLocation.Light,
            LastLocation.Tilt,
            LastLocation.Humidity,
            LastLocation.Altitude,
            LastLocation.LastMessage,
            customerIds.MarkerColor,
            customerIds.BusinessUnit,
            customerIds.CustomerRegion,
            LastLocation.RequestCod,
            LastLocation.Deviation,
            GPSTracking.DepartureLocationName DepartureLocation,
            GPSTracking.DestinationLocationName FinalDestinationLocation,
            GpsTracking.TrackingDetails
        from 
            customerIds
            Join GPSTracking on 
                customerIds.CrossRefId = GPSTracking.CustomerId
            Join GPSDevice on 
                GPSTracking.DeviceId = GPSDevice.DeviceId
            Join GPSDeviceType on 
                GPSDevice.DeviceTypeId = GPSDeviceType.DeviceTypeId
            Left Join LastLocation on 
                GPSTracking.TrackingId = LastLocation.TrackingId
            Left Join GPSTrackingEventStatus on 
                GPSTrackingEventStatus.EventStatusId = GPSTracking.StatusId

        where 
            StatusId in (1, 2)
            Order By GPSTracking.TrackingId Desc `

            console.log(userTrackings);
            let returnVal = {
                trackings: userTrackings.recordset,
            }
            console.log(returnVal);
            return returnVal
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        console.log('fuck')
    }



}
export const GetTrackingInfo = async (req) => {
    let isAuthed = req.user.userData.userPermissions.some(perm => perm.PermissionCode === 'GPSLIST');
    if (isAuthed) {
        let customerId = req.user.userData.userInfo[0].CustomerImpersonationId;
        try {
            await sql.connect('data source=asisprod.cwoxb7ccwa4v.us-east-1.rds.amazonaws.com,1433;initial catalog=ASISPortal;user id=asisportaluser;password=Azapuki9;MultipleActiveResultSets=True;')
            const pings = await sql.query`
        Declare @customerId int = ${customerId};

        With customerIds as ( 
            Select 
                Customer.CustomerId,
                Customer.CustomerKey,
                Customer.CustomerName,
                Customer.MarkerColor,
                Customer.BusinessUnit,
                Customer.CustomerRegion,
                Customer.CustomerId CrossRefId
            from 
                Customer 
            where 
                Customer.CustomerId = @customerId
            Union
            Select 
                Customer.CustomerId,
                Child.CustomerKey,
                Child.CustomerName,
                Child.MarkerColor,
                Child.BusinessUnit,
                Child.CustomerRegion,
                CustomerCrossRef.CrossRefId 
            from 
                Customer 
                Join CustomerCrossRef on 
                    Customer.CustomerId = CustomerCrossRef.CustomerId
                Join Customer Child on 
                    CustomerCrossRef.CrossRefId = Child.CustomerId
            where 
                Customer.CustomerId = @customerId
        )

        Select 
            GPSTracking.TrackingId,
            GPSTracking.CustomerId,
            GPSTracking.DepartueDate, 
            GPSTracking.DestinationDate,
            GPSTracking.DestinationLocationName,
			GPSTrackingEventStatus.EventStatusName,
			GPSTrackingEvent.Latitude,
			GPSTrackingEvent.Longitude,
			GPSTrackingEvent.EventDate,
			GPSTrackingEvent.Altitude,
			GPSTrackingEvent.Pressure,
			GPSTrackingEvent.Tilt,
			GPSTrackingEvent.Temperature,
            customerIds.CustomerName, 
            GPSTracking.DateAdded RequestDate,
            GPSTrackingEvent.Direction,
           GPSTrackingEvent.Temperature,
            GPSTrackingEvent.Pressure,
            GPSTrackingEvent.Light,
            GPSTrackingEvent.Tilt,
            GPSTrackingEvent.Humidity,
            GPSTrackingEvent.Altitude,
            GPSTrackingEvent.LastMessage,
			GPSTrackingEvent.LastBatteryPercentage,
			GPSTrackingEvent.MilesFromNextRoutePoint,
			GPSTrackingEvent.MilesRemaining,
			GPSTrackingEvent.RequestCod,
			GPSTrackingEvent.Comments,
			GPSTrackingEvent.EventLocation,

            GPSDeviceType.DeviceTypeName + ':' +  GpsDevice.DeviceName FullDeviceName,
            GPSDevice.IMEI, 
            GPSDeviceType.DeviceTypeName DeviceType,
            customerIds.MarkerColor,
            customerIds.BusinessUnit,
            customerIds.CustomerRegion,
            GPSTracking.DepartureLocationName DepartureLocation,
            GPSTracking.DestinationLocationName FinalDestinationLocation,
            GpsTracking.TrackingDetails
        from 
            customerIds
            Join GPSTracking on 
                customerIds.CrossRefId = GPSTracking.CustomerId
            Join GPSDevice on 
                GPSTracking.DeviceId = GPSDevice.DeviceId
            Join GPSDeviceType on 
                GPSDevice.DeviceTypeId = GPSDeviceType.DeviceTypeId
			Join GPSTrackingEvent on 
				GPSTrackingEvent.TrackingId = GPSTracking.TrackingId
			Left Join GPSTrackingEventStatus on 
				GPSTrackingEventStatus.EventStatusId = GPSTrackingEvent.EventStatusId

        where 
            GPSTracking.TrackingId = ${req.body.trackingId}`

            const trackingInfo = await sql.query`
        Declare @customerId int = ${customerId};
        With customerIds as ( 
            Select 
                Customer.CustomerId,
                Customer.CustomerKey,
                Customer.CustomerName,
                Customer.MarkerColor,
                Customer.BusinessUnit,
                Customer.CustomerRegion,
                Customer.CustomerId CrossRefId
            from 
                Customer 
            where 
                Customer.CustomerId = @customerId
            Union
            Select 
                Customer.CustomerId,
                Child.CustomerKey,
                Child.CustomerName,
                Child.MarkerColor,
                Child.BusinessUnit,
                Child.CustomerRegion,
                CustomerCrossRef.CrossRefId 
            from 
                Customer 
                Join CustomerCrossRef on 
                    Customer.CustomerId = CustomerCrossRef.CustomerId
                Join Customer Child on 
                    CustomerCrossRef.CrossRefId = Child.CustomerId
            where 
                Customer.CustomerId = @customerId
        )

        Select 
            GPSTracking.TrackingId,
            GPSTracking.CustomerId,
            GPSTracking.DepartueDate, 
            GPSTracking.DestinationDate,
            GPSTracking.DestinationLocationName,
			(Select DeviceTypeName+':' + DeviceName from GPSDevice Where GPSDevice.DeviceId = GPSTracking.DeviceId) PrimaryDevice,
			(Select DeviceTypeName+ ':' + DeviceName from GPSDevice Where GPSDevice.DeviceId = GPSTracking.DeviceIdSecondary) SecondaryDevice,
			(Select LastBatteryPercentage from GPSDevice Where GPSDevice.DeviceId = GPSTracking.DeviceId) PrimaryBatteryLevel,
			(Select LastBatteryPercentage from GPSDevice Where GPSDevice.DeviceId = GPSTracking.DeviceIdSecondary) SecondaryBatteryLevel,
			GPSTrackingEventStatus.EventStatusName,
            customerIds.CustomerName, 
            GPSTracking.DateAdded RequestDate,
            LastLocation.EventDate LastPingDate,
            LastLocation.EventLocation LastPingLocation,
            LastLocation.MilesRemaining,
            LastLocation.Comments,
            LastLocation.IsPinging,
            LastLocation.IsDeleted,
            LastLocation.CustomerUpdated,
            LastLocation.TrackerData,
            LastLocation.Longitude,
            LastLocation.Latitude,
            GPSDeviceType.DeviceTypeName + ':' +  GpsDevice.DeviceName FullDeviceName,
            GPSDevice.IMEI, 
            LastLocation.LastBatteryPercentage,
            GPSDeviceType.DeviceTypeName DeviceType,
            LastLocation.Direction,
            LastLocation.Temperature,
            LastLocation.Pressure,
            LastLocation.Light,
            LastLocation.Tilt,
            LastLocation.Humidity,
            LastLocation.Altitude,
            LastLocation.LastMessage,
            customerIds.MarkerColor,
            customerIds.BusinessUnit,
            customerIds.CustomerRegion,
            LastLocation.RequestCod,
            LastLocation.Deviation,
            GPSTracking.DepartureLocationName DepartureLocation,
            GPSTracking.DestinationLocationName FinalDestinationLocation,
            GpsTracking.TrackingDetails
        from 
            customerIds
            Join GPSTracking on 
                customerIds.CrossRefId = GPSTracking.CustomerId
            Join GPSDevice on 
                GPSTracking.DeviceId = GPSDevice.DeviceId
            Join GPSDeviceType on 
                GPSDevice.DeviceTypeId = GPSDeviceType.DeviceTypeId
            Left Join LastLocation on 
                GPSTracking.TrackingId = LastLocation.TrackingId
			Left Join GPSTrackingEventStatus on 
				GPSTrackingEventStatus.EventStatusId = LastLocation.EventStatusId
        where 
			GPSTracking.TrackingId = ${req.body.trackingId}`


            let returnVal = {
                Pings: pings.recordset,
                TrackingInfo: trackingInfo.recordset
            }
            console.log(returnVal);
            return returnVal
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        console.log('fuck')
    }
}
export const GetDevices = async (req) => {
    let isAuthed = req.user.userData.userPermissions.some(perm => perm.PermissionCode === 'GPSLIST');
    if (isAuthed) {
        let customerId = req.user.userData.userInfo[0].CustomerImpersonationId;
        // if(req.user.userData.userPermissions.includes(perm => perm.PermissionCode === 'GPSLIST'))
        // {
        try {
            await sql.connect('data source=asisprod.cwoxb7ccwa4v.us-east-1.rds.amazonaws.com,1433;initial catalog=ASISPortal;user id=asisportaluser;password=Azapuki9;MultipleActiveResultSets=True;')
            const devices = await sql.query`
        Declare @customerId int = ${customerId};
With customerIds as ( 
    Select 
		Customer.CustomerId,
		Customer.CustomerKey,
		Customer.CustomerName,
		Customer.MarkerColor,
		Customer.CustomerId CrossRefId
	from 
		Customer 
	where 
		Customer.CustomerId = @customerId
	Union
	Select 
		Customer.CustomerId,
		Child.CustomerKey,
		Child.CustomerName,
		Child.MarkerColor,
		CustomerCrossRef.CrossRefId 
	from 
		Customer 
		Join CustomerCrossRef on 
			Customer.CustomerId = CustomerCrossRef.CustomerId
		Join Customer Child on 
			CustomerCrossRef.CrossRefId = Child.CustomerId
	where 
		Customer.CustomerId = @customerId
)

Select 
	GPSDevice.DeviceName,
    GPSDeviceType.DeviceTypeName DeviceType,
    '' DeviceModel,
    GPSDevice.LastBatteryPercentage LastBatteryLevel,
    '' LastStatus,
    GPSDevice.LastMessage LastUpdated,
    customerIds.CustomerName CustomerName,
    IsNull(GPSDevice.IsPinging, 0 ) IsPinging,
    IsNull(GPSDevice.IsInternational, 0) IsInternational,
	GPSDevice.Latitude,
    GPSDevice.Longitude,
	GPSDevice.DeviceId RowId,
    GPSTracking.TrackingId,
    GPSDevice.IMEI
from 
    customerIds
	Join CustomerGPSDevice on 
		customerIds.CrossRefId = CustomerGPSDevice.CustomerId
	Join GPSDevice on 
		CustomerGPSDevice.DeviceId = GPSDevice.DeviceId
	Join GPSDeviceType on 
		GPSDevice.DeviceTypeId = GPSDeviceType.DeviceTypeId
	Left Join GPSTracking on 
		GPSDevice.DeviceId = GPSTracking.DeviceId and 
		GPSTracking.StatusId in (1,2)
where 
	GPSDevice.IsActive = 1`


            let returnVal = {
                Devices: devices.recordset,
            }
            console.log(returnVal);
            return returnVal
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        console.log('fuck')
    }



}

export const GetTrackingFilters = async (req) => {
    let isAuthed = req.user.userData.userPermissions.some(perm => perm.PermissionCode === 'GPSLIST');
    if (isAuthed) {

        let customerId = req.user.userData.userInfo[0].CustomerImpersonationId;
        // if(req.user.userData.userPermissions.includes(perm => perm.PermissionCode === 'GPSLIST'))
        // {
        try {
            await sql.connect('data source=asisprod.cwoxb7ccwa4v.us-east-1.rds.amazonaws.com,1433;initial catalog=ASISPortal;user id=asisportaluser;password=Azapuki9;MultipleActiveResultSets=True;')
            const customerDropdown = await sql.query`
 Declare @customerId int = ${customerId};

 
 Select 
     Customer.CustomerId,
     Customer.CustomerKey,
     Customer.CustomerName,
     Customer.MarkerColor,
     Customer.BusinessUnit,
     Customer.CustomerRegion,
     Customer.CustomerId CrossRefId
 from 
     Customer 
 where 
     Customer.CustomerId = @customerId
 Union
 Select 
     Customer.CustomerId,
     Child.CustomerKey,
     Child.CustomerName,
     Child.MarkerColor,
     Child.BusinessUnit,
     Child.CustomerRegion,
     CustomerCrossRef.CrossRefId 
 from 
     Customer 
     Join CustomerCrossRef on 
         Customer.CustomerId = CustomerCrossRef.CustomerId
     Join Customer Child on 
         CustomerCrossRef.CrossRefId = Child.CustomerId
 where 
     Customer.CustomerId = @customerId
`

            console.log(userTrackings);
            let returnVal = {
                trackings: userTrackings.recordset,
            }
            console.log(returnVal);
            return returnVal
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        console.log('fuck')
    }



}



export const GetMonitoringList = async (req) => {
    let isAuthed = req.user.userData.userPermissions.some(perm => perm.PermissionCode === 'GPSLIST');
    if (isAuthed) {

        let customerId = req.user.userData.userInfo[0].CustomerImpersonationId;
        // if(req.user.userData.userPermissions.includes(perm => perm.PermissionCode === 'GPSLIST'))
        // {
        try {
            await sql.connect('data source=asisprod.cwoxb7ccwa4v.us-east-1.rds.amazonaws.com,1433;initial catalog=ASISPortal;user id=asisportaluser;password=Azapuki9;MultipleActiveResultSets=True;')
            const monitoringList = await sql.query`
            with trackings as 
            (
                Select 
                    GPSTracking.TrackingId TrackingId,
                    GPSTracking.TrackingCustomerName TrackingCustomerName,
                    GPSTracking.DateAdded RequestDate,
                    GPSTracking.DepartureLocationName DepartureLocation,
                    GPSTracking.DepartueDate DepartureDate ,
                    GPSTracking.DepartueDate DepartureDateUTC,
                    GPSTracking.DestinationLocationName FinalDestinationLocation,
                    GPSTracking.DestinationDate FinalDestinationDate,
                    GPSTracking.DestinationDate FinalDestinationDateUTC ,
                    GPSTracking.StatusId StatusId,
                    GPSTrackingStatus.StatusName StatusName,
                    Customer.CustomerName CustomerName,
                    GPSTracking.CustomerId CustomerId,
                    GPSTracking.UpdateFrequency UpdateFrequency,
                    GPSTracking.SOPSUpdateFrequency SOPSUpdateFrequency,
                    GPSTracking.DevicePingFrequency DevicePingFrequency,
                    Case when GPSTracking.DeviceId > 0 then GPSDeviceType.DeviceTypeName + ': ' + GPSDevice.DeviceName else '' end FullDeviceName,
                    isNull(GPSDevice.PingRate, -1) PingRate
                From

                    GPSTracking
                    Join Customer on

                        GPSTracking.CustomerId = Customer.CustomerId
                    Join GPSTrackingStatus on

                        GPSTracking.StatusId = GPSTrackingStatus.StatusId
                    Join GPSDevice on

                        GPSTracking.DeviceId = GPSDevice.DeviceId
                    Join GPSDeviceType on

                        GPSDevice.DeviceTypeId = GPSDeviceType.DeviceTypeId

                where

                    GPSTracking.StatusId in (1,2)
            ),
            lastEvents as 
            (
                Select
                    trackings.TrackingId,
                    Max(ISNULL(GPSTrackingEvent.TrackingEventId, 0)) LastTracking,
                    Max(Case when GPSTrackingEvent.CustomerUpdated = 1 then GPSTrackingEvent.TrackingEventId else 0 end ) LastEmailTracking
                From

                    trackings
                    Left Join GPSTrackingEvent on
                        trackings.TrackingId = GPSTrackingEvent.TrackingId  and
                        GPSTrackingEvent.AddedById <> 1018  
                    
                Group by
                    trackings.TrackingId
            )
            Select
                trackings.TrackingId,
                trackings.TrackingCustomerName,
                trackings.RequestDate,
                trackings.DepartureLocation,
                trackings.DepartureDate ,
                trackings.DepartureDateUTC,
                trackings.FinalDestinationLocation,
                trackings.FinalDestinationDate,
                trackings.FinalDestinationDateUTC ,
                trackings.StatusId,
                trackings.StatusName,
                LastUpdate.TrackingEventId LastUpdateEventId,
                LastUpdate.AddedDate LastEventDate,
                LastUpdate.AddedDate LastEventDateUTC,
                LastUpdate.EventTypeId LastEventTypeId,
                LastUpdateType.EventTypeName LastEventTypeName,
                LastUpdate.AddedByFullName LastEventTypeBy,
                'SOPS' LastEventType,
                LastEmailSent.TrackingEventId LastEmailSentEventId,
                LastEmailSent.AddedDate LastCustomerEmailEventDate,
                LastEmailSent.AddedDate LastCustomerEmailEventDateUTC,
                LastEmailSent.EventTypeId LastCustomerEmailEventTypeId,
                LastEmailSentType.EventTypeName LastCustomerEmailEventTypeName,
                LastEmailSent.AddedByFullName LastCustomerEmailEventTypeBy,
                'Email' LastCustomerEmailEventType,
                trackings.CustomerName,
                trackings.CustomerId,
                trackings.UpdateFrequency,
                trackings.SOPSUpdateFrequency,
                trackings.DevicePingFrequency,
                trackings.FullDeviceName,
                trackings.PingRate
            from
                trackings
                Join lastEvents on

                    trackings.TrackingId = lastEvents.TrackingId

                Left Join GPSTrackingEvent LastUpdate on
                    lastEvents.LastTracking = LastUpdate.TrackingEventId

                Left Join GPSTrackingEventType LastUpdateType on
                    LastUpdate.EventTypeId = LastUpdateType.EventTypeId

                Left Join GPSTrackingEvent LastEmailSent on
                    lastEvents.LastEmailTracking = LastEmailSent.TrackingEventId

                Left Join GPSTrackingEventType LastEmailSentType on
                    LastEmailSent.EventTypeId = LastEmailSentType.EventTypeId

            `
            let returnVal = {
                Monitoring: monitoringList.recordset,
            }
            console.log(returnVal);
            return returnVal
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        console.log('fuck')
    }



}


